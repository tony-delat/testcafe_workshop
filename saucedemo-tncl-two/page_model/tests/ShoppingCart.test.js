import LoginPage from '../pages/LoginPage'
import ProductsPage from '../pages/ProductsPage'
import ShoppingCartPage from '../pages/ShoppingCartPage'
import { CREDENTIALS } from '../data/Constants'
import { Selector } from 'testcafe'


fixture('Shopping Cart Page Testing')
    .page `https://www.saucedemo.com/`


test('User is able to navigate to the Shopping Cart', async t=> {
    //login
    await LoginPage.authenticateToSauce(CREDENTIALS.VALID_USER.USERNAME, CREDENTIALS.VALID_USER.PASSWORD)

    //go to the shopping cart
    await t
        .click(ProductsPage.shoppingCartIcon)

    
    //validates shopping cart is displayed
    await t.expect(ShoppingCartPage.pageTitle.exists).ok()

})

test('User is able to add a single item to the shopping cart', async t=> {

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

test('User is able to add three items to the shopping cart', async t=> {

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


