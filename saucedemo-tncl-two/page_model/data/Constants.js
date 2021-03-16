import dotenv from 'dotenv'
dotenv.config()

export const CREDENTIALS = {
    VALID_USER: {
        USERNAME:process.env.V_USERNAME,
        PASSWORD:process.env.V_PASSWORD
    },
    INVALID_USER:{
        USERNAME:process.env.INV_USERNAME,
        PASSWORD:process.env.INV_PASSWORD
    },
    LOCKED_OUT_USER:{
        USERNAME:process.env.LO_USERNAME,
        PASSWORD:process.env.V_PASSWORD
    },
    PROBLEM_USER:{
        USERNAME:process.env.P_USERNAME,
        PASSWORD:process.env.V_PASSWORD
    },
    PERFORMANCE_GLITCH_USER:{
        USERNAME:process.env.PG_USERNAME,
        PASSWORD:process.env.V_PASSWORD
    }
}
