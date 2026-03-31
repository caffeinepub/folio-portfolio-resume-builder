import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Types
  public type UserProfile = {
    displayName : Text;
    username : Text;
  };

  type Resume = {
    personal : PersonalInfo;
    work : [WorkExperience];
    education : [Education];
    skills : [Text];
    projects : [Project];
    lastUpdated : Time.Time;
  };

  type Portfolio = {
    owner : Principal;
    displayName : Text;
    username : Text;
    resume : Resume;
    isPublished : Bool;
    plan : Plan;
    credits : Nat;
  };

  type PersonalInfo = {
    name : Text;
    title : Text;
    email : Text;
    phone : Text;
    website : Text;
    bio : Text;
  };

  type WorkExperience = {
    company : Text;
    role : Text;
    startDate : Text;
    endDate : Text;
    description : Text;
  };

  type Education = {
    institution : Text;
    degree : Text;
    field : Text;
    startYear : Text;
    endYear : Text;
  };

  type Project = {
    name : Text;
    description : Text;
    url : Text;
  };

  type Plan = {
    #free;
    #pro;
  };

  type PortfolioDTO = {
    owner : Principal;
    displayName : Text;
    username : Text;
    resume : Resume;
    isPublished : Bool;
    plan : Plan;
    credits : Nat;
    lastUpdated : Time.Time;
  };

  type PortfolioInput = {
    displayName : Text;
    username : Text;
    personal : PersonalInfo;
    work : [WorkExperience];
    education : [Education];
    skills : [Text];
    projects : [Project];
  };

  module Portfolio {
    public func compareByLastUpdated(portfolio1 : Portfolio, portfolio2 : Portfolio) : Order.Order {
      Int.compare(portfolio2.resume.lastUpdated, portfolio1.resume.lastUpdated);
    };
  };

  // State
  let portfolios = Map.empty<Principal, Portfolio>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let accessControlState = AccessControl.initState();

  include MixinAuthorization(accessControlState);

  // User Profile Management (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Get all portfolios (admin only - returns all portfolios including unpublished)
  public query ({ caller }) func getAllPortfolios() : async [PortfolioDTO] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all portfolios");
    };
    portfolios.values().toArray().sort(Portfolio.compareByLastUpdated).map(transformCompletePortfolio);
  };

  // Get published portfolios (public endpoint - anyone can view)
  public query ({ caller }) func getPublishedPortfolios() : async [PortfolioDTO] {
    portfolios.values().toArray().filter(func(p) { p.isPublished }).sort(Portfolio.compareByLastUpdated).map(transformCompletePortfolio);
  };

  // Get portfolio by principal (public if published, owner can view own, admin can view all)
  public query ({ caller }) func getPortfolio(user : Principal) : async PortfolioDTO {
    switch (portfolios.get(user)) {
      case (null) { Runtime.trap("Portfolio not found") };
      case (?portfolio) {
        if (portfolio.isPublished or caller == user or AccessControl.isAdmin(accessControlState, caller)) {
          transformCompletePortfolio(portfolio);
        } else {
          Runtime.trap("Unauthorized");
        };
      };
    };
  };

  // Get own portfolio (user only - private)
  public query ({ caller }) func getMyPortfolio() : async ?PortfolioDTO {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access their portfolio");
    };
    switch (portfolios.get(caller)) {
      case (null) { null };
      case (?portfolio) { ?transformCompletePortfolio(portfolio) };
    };
  };

  // Create or update portfolio (user only)
  public shared ({ caller }) func savePortfolio(input : PortfolioInput) : async PortfolioDTO {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save portfolios");
    };

    let existing = switch (portfolios.get(caller)) {
      case (null) {
        {
          owner = caller;
          displayName = input.displayName;
          username = input.username;
          plan = #free;
          credits = 5;
          isPublished = false;
          resume = {
            personal = input.personal;
            work = input.work;
            education = input.education;
            skills = input.skills;
            projects = input.projects;
            lastUpdated = Time.now();
          };
        };
      };
      case (?portfolio) {
        {
          portfolio with
          displayName = input.displayName;
          username = input.username;
          resume = {
            personal = input.personal;
            work = input.work;
            education = input.education;
            skills = input.skills;
            projects = input.projects;
            lastUpdated = Time.now();
          };
        };
      };
    };

    portfolios.add(caller, existing);
    transformCompletePortfolio(existing);
  };

  // Publish/unpublish portfolio (user only - deduct credits for free users)
  public shared ({ caller }) func setPublished(isPublished : Bool) : async PortfolioDTO {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can publish portfolios");
    };

    switch (portfolios.get(caller)) {
      case (null) { Runtime.trap("Portfolio not found") };
      case (?portfolio) {
        if (isPublished and portfolio.plan == #free and portfolio.credits == 0) {
          Runtime.trap("Insufficient credits. Upgrade to pro for unlimited publishing.");
        };

        let newPortfolio : Portfolio = {
          portfolio with
          isPublished;
          credits = if (isPublished and portfolio.plan == #free and not portfolio.isPublished) {
            if (portfolio.credits > 0) { portfolio.credits - 1 } else { 0 };
          } else {
            portfolio.credits;
          };
        };

        portfolios.add(caller, newPortfolio);
        transformCompletePortfolio(newPortfolio);
      };
    };
  };

  // Upgrade to pro plan (user only)
  public shared ({ caller }) func upgradeToPro() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upgrade their plan");
    };

    switch (portfolios.get(caller)) {
      case (null) { Runtime.trap("Portfolio not found") };
      case (?portfolio) {
        let upgraded : Portfolio = { portfolio with plan = #pro };
        portfolios.add(caller, upgraded);
      };
    };
  };

  // Admin: set or change user plan (admin only)
  public shared ({ caller }) func setUserPlan(user : Principal, plan : Plan) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set user plans");
    };

    switch (portfolios.get(user)) {
      case (null) { Runtime.trap("Portfolio not found") };
      case (?portfolio) {
        let updated : Portfolio = { portfolio with plan };
        portfolios.add(user, updated);
      };
    };
  };

  // Helper function to convert portfolio to DTO
  func transformCompletePortfolio(portfolio : Portfolio) : PortfolioDTO {
    {
      owner = portfolio.owner;
      displayName = portfolio.displayName;
      username = portfolio.username;
      resume = portfolio.resume;
      isPublished = portfolio.isPublished;
      plan = portfolio.plan;
      credits = portfolio.credits;
      lastUpdated = portfolio.resume.lastUpdated;
    };
  };

  // Utility: add skills to portfolio (user only)
  public shared ({ caller }) func addSkills(skills : [Text]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add skills");
    };

    switch (portfolios.get(caller)) {
      case (null) { Runtime.trap("Portfolio not found") };
      case (?portfolio) {
        let newSkills = skills;
        let updated : Portfolio = {
          portfolio with
          resume = {
            portfolio.resume with
            skills = portfolio.resume.skills.concat(newSkills);
            lastUpdated = Time.now();
          };
        };
        portfolios.add(caller, updated);
      };
    };
  };

  // Utility: remove skill from portfolio (user only)
  public shared ({ caller }) func removeSkill(skill : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove skills");
    };

    switch (portfolios.get(caller)) {
      case (null) { Runtime.trap("Portfolio not found") };
      case (?portfolio) {
        let filteredSkills = portfolio.resume.skills.filter(func(s) { s != skill });
        let updated : Portfolio = {
          portfolio with
          resume = {
            portfolio.resume with
            skills = filteredSkills;
            lastUpdated = Time.now();
          };
        };
        portfolios.add(caller, updated);
      };
    };
  };
};
