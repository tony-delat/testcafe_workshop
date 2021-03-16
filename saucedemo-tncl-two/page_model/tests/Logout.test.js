import LoginPage from '../pages/LoginPage'
import ProductsPage from '../pages/ProductsPage'
import { CREDENTIALS } from '../data/Constants'

fixture ('Logout functionality Testing')
    .page `https://www.saucedemo.com/`


test('Logged user is able to logout from the website', async t => {

    //login
    await LoginPage.authenticateToSauce(CREDENTIALS.VALID_USER.USERNAME, CREDENTIALS.VALID_USER.PASSWORD)
    
    //validate Products Page is displayed
    await t.expect(ProductsPage.pageTitle.exists).ok()

    //select the Logout option from the main menu
    await t
        .click(ProductsPage.menuBurgerIcon)
        .click(ProductsPage.logoutLink)

    //validate login page is displayed, thus user is no longer signed in
    await t.expect(LoginPage.robotImage.exists).ok()

})