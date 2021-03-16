import dotenv from 'dotenv'
dotenv.config()

export const BUYERS = {
    BUYER_1:{
        FIRSTNAME:process.env.FIRSTNAME,
        LASTNAME:process.env.LASTNAME,
        POSTALCODE:process.env.POSTALCODE
    }
}
