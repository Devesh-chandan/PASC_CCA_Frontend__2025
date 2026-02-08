export enum Department {
    CE = 'CE',
    IT = 'IT',
    ENTC = 'ENTC',
    ECE = 'ECE',
    AIDS = 'AIDS'
}

export interface IAuthResponse {
    user?: IUser;
    admin?: IAdmin;
    token: string;
}

// Backend never returns password in API responses
export interface IUser {
    id?: number;
    name?: string;
    email: string;
    department: Department;
    year: number;
    passoutYear: number;
    roll: number;
    hours: number;
}

export interface IAdmin {
    id?: number;
    name?: string;
    email: string;
    password?: string;  // Only used for registration, not returned in responses
}


