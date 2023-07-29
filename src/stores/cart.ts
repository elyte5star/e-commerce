
import { defineStore } from 'pinia';


//Persisting the Cart and cart count
let cart = localStorage.getItem('cart');

let itemsInCart = window.localStorage.getItem('cartCount');

import { axiosInstance } from '@/helpers/axiosHttp';

import type { Item } from '@/helpers/my-types';

import { userAlertStore } from './alert';


export const userCartStore = defineStore({
    id: 'cart',
    state: () => ({
        cart: cart ? JSON.parse(cart) : [], itemsInCart: itemsInCart ? parseInt(itemsInCart) : 0, alertStore: userAlertStore()
    }),
    actions: {
        addToCart(item: Item, volume: number) {

            for (let i = 0; i < volume; i++) {
                let found = this.cart.find((itemInCart: Item) => itemInCart.pid == item.pid);

                if (found) {
                    found.quantity++;
                    found.calculated_price = found.quantity * found.price

                } else {
                    item.quantity = 1;
                    item.calculated_price = item.price
                    this.cart.push(item);
                }

                localStorage.setItem('cart', JSON.stringify(this.cart));
                this.itemsInCart = this.cart.reduce((accumulator: number, currentValue: Item) => accumulator + currentValue.quantity, 0);//this.cart.length;
                localStorage.setItem('cartCount', JSON.stringify(this.itemsInCart));

            }
        },
        removeFromCart(itemToBeRemoved: Item) {

            let indexItemToBeRemoved = this.cart.findIndex((a: Item) => a.pid === itemToBeRemoved.pid);

            if (indexItemToBeRemoved > -1) {

                let item = this.cart[indexItemToBeRemoved];

                item.quantity--;

                if (item.quantity == 0) {

                    this.cart.splice(indexItemToBeRemoved, 1);

                } else {

                    item.calculated_price = item.quantity * item.price

                }

                localStorage.setItem('cart', JSON.stringify(this.cart));
                this.itemsInCart = this.cart.reduce((accumulator: number, currentValue: Item) => accumulator + currentValue.quantity, 0);
                localStorage.setItem('cartCount', JSON.stringify(this.itemsInCart));

            } else {
                this.alertStore.success("Product not found in cart!")

            }

        },
        clearCart() {
            while (this.cart.length > 0) {
                this.cart.pop();
            }
            this.itemsInCart = 0;
            this.cart = [];
            localStorage.removeItem('cart');
            localStorage.removeItem('cartCount');

        },
        async checkOut(bookingDetails: any) {

            const response = await axiosInstance.post('booking/create', bookingDetails);
            if (!response.data.success) {
                this.alertStore.error(response.data.message || 'Couldnt make reservation');
                return;
            }
            this.alertStore.success("Booking with id " + response.data.oid + " created!")
            this.clearCart();

        },
        async checkOutQueue(bookingDetails: any) {
            const response = await axiosInstance.post('q_booking/create', bookingDetails);
            if (response.data.success) {
                this.alertStore.success("Booking with id " + response.data.oid + " created!")
                this.clearCart();

            } else {
                this.alertStore.error(response.data.message);
            }

        }
    }
});