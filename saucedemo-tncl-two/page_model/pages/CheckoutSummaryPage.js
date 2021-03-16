import { Selector, t } from 'testcafe'

class CheckoutSummaryPage{

    constructor(){
        this.pageHeader = Selector('.subheader')
        this.cartItemList = Selector ('.cart_list')
            .child('.cart_item')
        this.finishButton = Selector ('.btn_action')
    }

    async getSelectedItemName(index){

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

export default new CheckoutSummaryPage()