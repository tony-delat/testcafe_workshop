import LoginPage from '../pages/LoginPage'
import ProductsPage from '../pages/ProductsPage'
import ShoppingCartPage from '../pages/ShoppingCartPage'
import CheckoutInfoPage from '../pages/CheckoutInfoPage'
import CheckoutSummaryPage from '../pages/CheckoutSummaryPage'
import ThankYouPage from '../pages/ThankYouPage'
import { CREDENTIALS } from '../data/Constants'
import { BUYERS } from '../data/BuyerInfo'


fixture('Checkout Overview Page Testing')
    .page `https://www.saucedemo.com/`

test('User is able to add three items and go to the checkout overview page', async t=> {

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

test('User can successfully purchase an item', async t => {

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
