import LoginPage from '../pages/LoginPage'
import ProductsPage from '../pages/ProductsPage'
import ShoppingCartPage from '../pages/ShoppingCartPage'
import CheckoutInfoPage from '../pages/CheckoutInfoPage'
import CheckoutSummaryPage from '../pages/CheckoutSummaryPage'
import { CREDENTIALS } from '../data/Constants'
import { BUYERS } from '../data/BuyerInfo'

fixture('Checkout Personal Info Page Testing')
    .page `https://www.saucedemo.com/`

test('User is unable to proceed with purchase if personal info is not entered', async t => {

//login
await LoginPage.authenticateToSauce(CREDENTIALS.VALID_USER.USERNAME, CREDENTIALS.VALID_USER.PASSWORD)

//product index generation for further selection
const count = await ProductsPage.productList.count
const ind = await ProductsPage.getRandomInt(count)

//select the product
await ProductsPage.selectItemToShop(ind)

//after product is selected, go to the shopping cart
await t
    .click(ProductsPage.shoppingCartIcon)
    .wait(2000)

//click on the checkout button to proceed with personal information input
await t
    .click(ShoppingCartPage.checkoutButton)
    .wait(2000)

//assert - validate Checkout Page (Personal Info) page is displayed
await t.expect(CheckoutInfoPage.pageHeader.innerText).eql('Checkout: Your Information')

//click on continue while all fields are empty
await t
    .click(CheckoutInfoPage.continueButton)

//assert error message
await t.expect(CheckoutInfoPage.errorMessage.innerText).eql('Error: First Name is required')

//enter First Name value only, click on Continue and assert error message
await t.typeText(CheckoutInfoPage.firstNameField, BUYERS.BUYER_1.FIRSTNAME, {paste:true})
await t.click(CheckoutInfoPage.continueButton)
await t.expect(CheckoutInfoPage.errorMessage.innerText).eql('Error: Last Name is required')

//enter Last Name value -Postal Code pending-, click on Continue and assert error message
await t.typeText(CheckoutInfoPage.lastNameField, BUYERS.BUYER_1.LASTNAME, {paste:true})
await t.click(CheckoutInfoPage.continueButton)
await t.expect(CheckoutInfoPage.errorMessage.innerText).eql('Error: Postal Code is required')

})

test('User can access Checkout Summary page upon entering personal details', async t => {

    //login
    await LoginPage.authenticateToSauce(CREDENTIALS.VALID_USER.USERNAME, CREDENTIALS.VALID_USER.PASSWORD)
    
    //product index generation for further selection
    const count = await ProductsPage.productList.count
    const ind = await ProductsPage.getRandomInt(count)
    
    //select the product
    await ProductsPage.selectItemToShop(ind)
    
    //after product is selected, go to the shopping cart
    await t
        .click(ProductsPage.shoppingCartIcon)
        .wait(2000)
    
    //click on the checkout button to proceed with personal information input
    await t
        .click(ShoppingCartPage.checkoutButton)
        .wait(2000)
    
   
    //populate first name, last name and postal code fields
    await CheckoutInfoPage.enterBuyerInfo(BUYERS.BUYER_1.FIRSTNAME,BUYERS.BUYER_1.LASTNAME, BUYERS.BUYER_1.POSTALCODE)

    //click on Continue
    await t.click(CheckoutInfoPage.continueButton)

    //Validate Checkout Summary Page is displayed
    await t.expect(CheckoutSummaryPage.pageHeader.innerText).eql('Checkout: Overview')
    
    
    })