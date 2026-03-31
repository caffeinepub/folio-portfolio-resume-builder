import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface PortfolioDTO {
    resume: Resume;
    credits: bigint;
    username: string;
    isPublished: boolean;
    displayName: string;
    owner: Principal;
    plan: Plan;
    lastUpdated: Time;
}
export interface WorkExperience {
    endDate: string;
    role: string;
    description: string;
    company: string;
    startDate: string;
}
export interface Education {
    field: string;
    startYear: string;
    endYear: string;
    institution: string;
    degree: string;
}
export interface PersonalInfo {
    bio: string;
    title: string;
    name: string;
    email: string;
    website: string;
    phone: string;
}
export interface Resume {
    projects: Array<Project>;
    education: Array<Education>;
    work: Array<WorkExperience>;
    lastUpdated: Time;
    personal: PersonalInfo;
    skills: Array<string>;
}
export interface Project {
    url: string;
    name: string;
    description: string;
}
export interface PortfolioInput {
    username: string;
    displayName: string;
    projects: Array<Project>;
    education: Array<Education>;
    work: Array<WorkExperience>;
    personal: PersonalInfo;
    skills: Array<string>;
}
export interface UserProfile {
    username: string;
    displayName: string;
}
export enum Plan {
    pro = "pro",
    free = "free"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addSkills(skills: Array<string>): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    getAllPortfolios(): Promise<Array<PortfolioDTO>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMyPortfolio(): Promise<PortfolioDTO | null>;
    getPortfolio(user: Principal): Promise<PortfolioDTO>;
    getPublishedPortfolios(): Promise<Array<PortfolioDTO>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removeSkill(skill: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    savePortfolio(input: PortfolioInput): Promise<PortfolioDTO>;
    setPublished(isPublished: boolean): Promise<PortfolioDTO>;
    setUserPlan(user: Principal, plan: Plan): Promise<void>;
    upgradeToPro(): Promise<void>;
}
