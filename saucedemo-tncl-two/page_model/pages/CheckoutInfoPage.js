import { Selector, t } from 'testcafe'

class CheckoutInfoPage{

    constructor(){
        this.pageHeader = Selector('.subheader')
        this.continueButton = Selector('.btn_primary')
        this.errorMessage = Selector('h3')
        this.firstNameField = Selector('#first-name')
        this.lastNameField = Selector('#last-name')
        this.postalCodeField = Selector('#postal-code')
    }

    async enterBuyerInfo(firstName, lastName, postalCode){

        await t.typeText(this.firstNameField, firstName, {paste:true})
        await t.typeText(this.lastNameField, lastName, {paste:true})
        await t.typeText(this.postalCodeField, postalCode, {paste:true})
    }

}

export default new CheckoutInfoPage()