import { Selector, t } from 'testcafe'

class LoginPage{

    constructor(){
        this.usernameField = Selector('#user-name')
        this.passwordField = Selector('#password')
        this.loginButton = Selector('#login-button')
        this.loginErrorMsg = Selector('h3[data-test="error"]')
        this.robotImage = Selector('.bot_column')
    }

    async authenticateToSauce(username, password){
        await t.typeText(this.usernameField, username, {paste:true})
        await t.typeText(this.passwordField, password, {paste:true})
        await t.click(this.loginButton)

    }

}

export default new LoginPage()