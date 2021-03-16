import { Selector, t } from 'testcafe'

class ProductsPage{

    constructor(){
        this.pageTitle = Selector('.product_label')
        this.shoppingCartIcon = Selector('#shopping_cart_container')
        this.menuBurgerIcon = Selector('#react-burger-menu-btn')
        this.logoutLink = Selector('#logout_sidebar_link')
        this.productList = Selector('.inventory_list')
            .child('div')
        this.productName = Selector('.inventory_list')
            .child('div')
            .nth(1)
            .child('div')
            .nth(1) //inventory_item_label
            .child('a')
            .child('div')
        this.addProductButton = Selector('.inventory_list')
            .child('div')
            .nth(1)
            .child('div')
            .nth(2) //inventory_pricebar
            .child('button')
    }

    async getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
      }


    async getSelectedProductName(index){

            const selectedProductName = await Selector('.inventory_list')
            .child('div')
            .nth(index)
            .child('div')
            .nth(1) //inventory_item_label
            .child('a')
            .child('div')
            .innerText

            return selectedProductName;

    }


    async getSelectedProductAddButton(index){

        const selectedProductAddButton = await Selector('.inventory_list')
            .child('div')
            .nth(index)
            .child('div')
            .nth(2) //inventory_pricebar
            .child('button')

        return selectedProductAddButton;

        }


        async getIndexList(count){

            var indexList = [0, 0, 0];
            var i = 0

            for (i = 0; i <= 2 ; i ++){
                indexList[i] = await this.getRandomInt(count)
            }

            
            var x = 0
            var ind = 0
            var f = true
            var val = 0

            while (f == true){

                x = 0
                val = indexList[ind]

                while(x <= 2){

                    if(x == ind){
                        x++
                    }
                    else{
                        if( val != indexList[x]){
                            x++
                        }
                        else{
                            indexList[x] = await this.getRandomInt(count)
                        }
                    }

                }


                ind++

                if(ind > 2){
                    f = false
                }

            }

    
            return indexList;
    
            }

    async selectItemToShop(index){

        var productText
        var productButton

        productText = await this.getSelectedProductName(index)
        productButton = await this.getSelectedProductAddButton(index)
    
        await t.click(productButton)
            .wait(2000)

        return productText;

    }

}


export default new ProductsPage()