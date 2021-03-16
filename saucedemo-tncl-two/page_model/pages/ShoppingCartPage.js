import { Selector } from 'testcafe'

class ShoppingCartPage{

    constructor(){
        this.pageTitle = Selector('.subheader')
        this.itemName = Selector('.inventory_item_name')
        this.continueShoppingButton = Selector('.btn_secondary')
        this.cartItemList = Selector ('.cart_list')
            .child('.cart_item')
        this.checkoutButton = Selector('.btn_action')
    }
    
    async getCartItemName(index){

        const selectedProductName = await Selector('.cart_list')
        .child('.cart_item')
        .nth(index)
        .child('div')
        .nth(1) //cart_item_label
        .child('a')
        .child('div')
        .innerText

        return selectedProductName;

}

}

export default new ShoppingCartPage()