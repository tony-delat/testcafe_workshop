import { Selector, t } from 'testcafe'

class ThankYouPage{

    constructor(){
        this.thankYouMessage = Selector('.complete-header')
    }

}

export default new ThankYouPage()