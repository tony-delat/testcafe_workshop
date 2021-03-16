import LoginPage from '../pages/LoginPage'
import ProductsPage from '../pages/ProductsPage'
import ShoppingCartPage from '../pages/ShoppingCartPage'
import CheckoutInfoPage from '../pages/CheckoutInfoPage'
import CheckoutSummaryPage from '../pages/CheckoutSummaryPage'
import ThankYouPage from '../pages/ThankYouPage'
import { CREDENTIALS } from '../data/Constants'
import { BUYERS } from '../data/BuyerInfo'

fixture('Login Page testing')
    .page `https://www.saucedemo.com/`


test('Test 1 - User is able to login using valid credentials', async t=> {

    await LoginPage.authenticateToSauce(CREDENTIALS.VALID_USER.USERNAME, CREDENTIALS.VALID_USER.PASSWORD)

    await t.expect(ProductsPage.pageTitle.exists).ok()


})

test('Test 2a - User is unable to login using invalid credentials', async t=> {

    await LoginPage.authenticateToSauce(CREDENTIALS.INVALID_USER.USERNAME, CREDENTIALS.INVALID_USER.PASSWORD)

    await t.expect(LoginPage.loginErrorMsg.exists).ok()
    await t.expect(LoginPage.loginErrorMsg.innerText).eql('Epic sadface: Username and password do not match any user in this service')


})

test('Test 2b - User is unable to login using wrong password', async t=> {

    await LoginPage.authenticateToSauce(CREDENTIALS.VALID_USER.USERNAME, CREDENTIALS.INVALID_USER.PASSWORD)

    await t.expect(LoginPage.loginErrorMsg.exists).ok()
    await t.expect(LoginPage.loginErrorMsg.innerText).eql('Epic sadface: Username and password do not match any user in this service')


})

test('Test 3 - Logged user is able to logout from the website', async t => {

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

test('Test 4 - User is able to navigate to the Shopping Cart', async t=> {
    //login
    await LoginPage.authenticateToSauce(CREDENTIALS.VALID_USER.USERNAME, CREDENTIALS.VALID_USER.PASSWORD)

    //go to the shopping cart
    await t
        .click(ProductsPage.shoppingCartIcon)

    
    //validates shopping cart is displayed
    await t.expect(ShoppingCartPage.pageTitle.exists).ok()

})

test('Test 5 - User is able to add a single item to the shopping cart', async t=> {

    //login
    await LoginPage.authenticateToSauce(CREDENTIALS.VALID_USER.USERNAME, CREDENTIALS.VALID_USER.PASSWORD)

    //get product count and based on that value, generate a random index to select a product from the list
    const count = await ProductsPage.productList.count
    const ind = await ProductsPage.getRandomInt(count)
    var productText

    //select the product, its name is stored on productText for further assertion
    productText = await ProductsPage.selectItemToShop(ind)

    //after product is selected, go to the shopping cart
    await t
        .click(ProductsPage.shoppingCartIcon)
        .wait(2000)

    //assertion - validating the product name from the products page is equal to the name on the shopping cart
    await t.expect(ShoppingCartPage.itemName.innerText).eql(productText)
})

test('Test 6 - User is able to add three items to the shopping cart', async t=> {

    //login
    await LoginPage.authenticateToSauce(CREDENTIALS.VALID_USER.USERNAME, CREDENTIALS.VALID_USER.PASSWORD)

    //get product count and based on that value, generate a 3-number array with 3 unique product indexes
    //which are randomly generated (i.e. if 6 is the max product count, the array will contain 3 different
    //numbers to identify 3 different products - for instance 0, 5, 2)
    var count = await ProductsPage.productList.count
    var indexList = []
    indexList = await ProductsPage.getIndexList(count)

    //productTextList will store the 3 selected products' names
    var productTextList = []
    var productButton
    var i = 0
    var val

//select 3 different items

for(i = 0; i <= 2; i++){

    val = await ProductsPage.selectItemToShop(i)
    //save each product name in the list
    productTextList.push(val)

}

//after the 3 products are selected, click on the shopping cart button on the product's page
    await t
        .click(ProductsPage.shoppingCartIcon)
        .wait(2000)


//assess labels: compare 1st product's name from the products page with the 1st product from the shopping cart and so forth

    await t.expect(await ShoppingCartPage.getCartItemName(0)).eql(productTextList[0])
    await t.expect(await ShoppingCartPage.getCartItemName(1)).eql(productTextList[1])
    await t.expect(await ShoppingCartPage.getCartItemName(2)).eql(productTextList[2])

})

test('Test 7 - User is unable to proceed with purchase if personal info is not entered', async t => {

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
    
test('Test 8 - User can access Checkout Summary page upon entering personal details', async t => {

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

    test('Test 9 - User is able to add three items and go to the checkout overview page', async t=> {

        //login
        await LoginPage.authenticateToSauce(CREDENTIALS.VALID_USER.USERNAME, CREDENTIALS.VALID_USER.PASSWORD)
    
        //get product count and select 3 products' indexes randomly for further selection
        var count = await ProductsPage.productList.count
        var indexList = []
        indexList = await ProductsPage.getIndexList(count)
    
        //productTextList will store the 3 selected products' names
        var productTextList = []
        var i = 0
        var val
    
    //select 3 different items
    
    for(i = 0; i <= 2; i++){
    
        val = await ProductsPage.selectItemToShop(i)
        //save each product name in the list
        productTextList.push(val)
    
    }
    
    //after the 3 products are selected, click on the shopping cart button on the product's page
        await t
            .click(ProductsPage.shoppingCartIcon)
            .wait(2000)
    
    //click on the checkout button to proceed with personal information input
    await t
    .click(ShoppingCartPage.checkoutButton)
    
    
    //populate first name, last name and postal code fields
    await CheckoutInfoPage.enterBuyerInfo(BUYERS.BUYER_1.FIRSTNAME,BUYERS.BUYER_1.LASTNAME, BUYERS.BUYER_1.POSTALCODE)
    
    //click on Continue
    await t.click(CheckoutInfoPage.continueButton)
    
    //assess labels: compare 1st product's name from the products page with the 1st product from the shopping cart and so forth
    
        await t.expect(await CheckoutSummaryPage.getSelectedItemName(0)).eql(productTextList[0])
        await t.expect(await CheckoutSummaryPage.getSelectedItemName(1)).eql(productTextList[1])
        await t.expect(await CheckoutSummaryPage.getSelectedItemName(2)).eql(productTextList[2])
    
    })
    
    test('Test 10 - User can successfully purchase an item', async t => {
    
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
    
        //click on Finish
        await t.click(CheckoutSummaryPage.finishButton)
    
        //Validate Thank You page is displayed
        await t.expect(ThankYouPage.thankYouMessage.innerText).eql('THANK YOU FOR YOUR ORDER')
        
        
        })
    
