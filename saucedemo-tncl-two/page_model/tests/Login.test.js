import LoginPage from '../pages/LoginPage'
import ProductsPage from '../pages/ProductsPage'
import { CREDENTIALS } from '../data/Constants'

fixture('Login Page testing')
    .page `https://www.saucedemo.com/`


test('User is able to login using valid credentials', async t=> {

    await LoginPage.authenticateToSauce(CREDENTIALS.VALID_USER.USERNAME, CREDENTIALS.VALID_USER.PASSWORD)

    await t.expect(ProductsPage.pageTitle.exists).ok()


})

test('User is unable to login using invalid credentials', async t=> {

    await LoginPage.authenticateToSauce(CREDENTIALS.INVALID_USER.USERNAME, CREDENTIALS.INVALID_USER.PASSWORD)

    await t.expect(LoginPage.loginErrorMsg.exists).ok()
    await t.expect(LoginPage.loginErrorMsg.innerText).eql('Epic sadface: Username and password do not match any user in this service')


})

test('User is unable to login using wrong password', async t=> {

    await LoginPage.authenticateToSauce(CREDENTIALS.VALID_USER.USERNAME, CREDENTIALS.INVALID_USER.PASSWORD)

    await t.expect(LoginPage.loginErrorMsg.exists).ok()
    await t.expect(LoginPage.loginErrorMsg.innerText).eql('Epic sadface: Username and password do not match any user in this service')


})