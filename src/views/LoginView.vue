<template>
    <!-- Login panel -->
    <div id="login_access" class="login_access">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <form @submit.prevent="onSubmitLogin" class="login-form" id="login_form">
                        <div class="text-center mb-3">
                            <p>Sign in with:</p>
                            <button v-on:click.prevent="msoftLogin" type="button"
                                class="btn btn-link btn-floating mx-1">
                                <i class="fa fa-windows"></i>
                            </button>
                            <button v-on:click.prevent="googleLogin" type="button"
                                class="btn btn-link btn-floating mx-1">
                                <i class="fa fa-google"></i>
                            </button>
                        </div>

                        <p class="text-center">or:</p>
                        <!-- Username input -->
                        <div class="form-outline">
                            <label class="form-label" for="loginUsername">Username:</label>
                            <input type="text" id="loginUsername" v-model="username" class="form-control"
                                aria-describedby="usernameHelpBlock" maxlength="20" />

                        </div>

                        <!-- Password input -->
                        <div class="form-outline">
                            <label class="form-label" for="loginPassword">Password:</label>
                            <input type="password" name="password" id="password" v-model.lazy="password"
                                class="form-control" aria-describedby="passwordHelpBlock" autocomplete="on"
                                maxlength="20" />
                            <a href="javascript:void(0)" @click="showPassword('password')"><i class="bi bi-eye-slash"
                                    id="toggleLoginPassword"></i></a>

                        </div>
                        <div id="forgetget_password">
                            <router-link :to="{ name: 'OtpEmail', query: { passwordReset: 'true' } }">Forgot
                                password?</router-link>
                        </div>

                        <!-- Submit button -->
                        <button type="submit" class="btn btn-outline-primary">Sign in</button>

                        <!-- Register buttons -->
                        <div class="text-center">
                            <p>Not a member? <router-link :to="{ name: 'Register' }">Register</router-link></p>
                        </div>
                    </form>
                </div>
                <div class="col-md-6">
                    <div class="ibox">
                        <div class="ibox-title">
                            <h5>Support</h5>
                        </div>
                        <div class="ibox-content text-center">
                            <h3><i class="fa fa-phone"></i> +47 409 78 057</h3>
                            <h3>
                                <a href="mailto:elyte5star@gmail.com"><i class="fa fa-envelope-o"></i>
                                    elyte5star@gmail.com</a>
                            </h3>
                            <h3>
                                <a href="https://github.com/elyte5star"><i class="fa fa-github"></i> elyte5star</a>
                            </h3>
                            <span class="small">
                                Please contact with us if you have any questions. We are avalible 24h.
                            </span>
                        </div>
                    </div>
                    <div v-if="products" class="ibox">
                        <p class="font-bold">Products you may be interested</p>
                        <div id="recommendation_list" v-for="item in Array.prototype.slice.call(products, 1, 3)"
                            v-bind:key="item.pid" class="ibox-content">
                            <div class="table-responsive">
                                <table class="table shoping-cart-table">
                                    <tbody>
                                        <tr>
                                            <td :style="{ width: '90px' }">
                                                <div class="cart-product-imitation">
                                                    <img :src="'src/assets/images/products/' + item.image"
                                                        v-bind:alt="item.name" />
                                                </div>
                                            </td>
                                            <td class="desc">
                                                <h3>
                                                    <router-link :to="{ name: 'oneProduct', params: { pid: item.pid } }"
                                                        class="text-navy">
                                                        {{ item.name }}
                                                    </router-link>
                                                </h3>
                                                <p class="small">
                                                    {{ item.details }}
                                                </p>
                                                <dl class="small m-b-none">
                                                    <dt>Description</dt>
                                                    <dd>{{ item.description }}</dd>
                                                </dl>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <hr />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
/* eslint-disable */
import { userAuthStore } from '@/stores/auth_store'
import { storeToRefs } from 'pinia'
import { isUserNameValid, showPassword, decodeJwtResponse } from '@/helpers/script'
import { loginRequest, _msalInstance } from '@/helpers/msoftAuthConfig'
import { googleProvider } from '@/helpers/gmailAuthConfig'
import { defineComponent } from 'vue'
import type { AccountInfo } from '@azure/msal-browser'
import type { CloudLogin, Product } from '@/helpers/my-types'
import { productStore } from '@/stores/products'
import type { CredentialResponse, PromptMomentNotification } from 'google-oauth-gsi'

export default defineComponent({
    name: 'LoginView',
    setup() {
        const pStore = productStore()
        const { products } = storeToRefs(pStore)
        return { products, pStore }
    },
    data() {
        return {
            user: {},
            msalInstance: _msalInstance,
            username: null || '',
            password: null,
            showPassword,
            authStore: userAuthStore()

        }
    },
    methods: {
        async getAllProducts() {
            await this.pStore.getProducts()
        },
        async googleLogin(): Promise<void> {
            const oneTap = googleProvider.useGoogleOneTapLogin({
                cancel_on_tap_outside: true,
                onSuccess: (response: CredentialResponse) => this.sendGmailToken(response.credential!!),
                promptMomentNotification: (notification: PromptMomentNotification) => this.gMailNotification(notification)
            });
            oneTap();
        },
        gMailNotification(notification: PromptMomentNotification) {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                this.authStore.alert.error("Login with google not available, continue with another identity provider");
            }

        },
        async sendGmailToken(idToken: string) {
            const data: CloudLogin = {
                token: idToken,
                authType: 'GMAIL'

            }
            await this.authStore.cloudLogin(data);
        },
        async msoftLogin(): Promise<void> {
            try {
                //await this.msalInstance.handleRedirectPromise()
                await this.msalInstance.loginPopup(loginRequest)
                const accounts = this.msalInstance.getAllAccounts()
                if (accounts.length === 0) {
                    return this.msalInstance.loginRedirect(loginRequest)
                }
                const account: AccountInfo = accounts[0]
                const data: CloudLogin = {
                    token: account.idToken,
                    authType: 'MSOFT'
                }
                await this.authStore.cloudLogin(data)
            } catch (error) {
                this.authStore.alert.error(`error during authentication: ${error}`)
            }
        },

        async handleMsalRedirect() {
            await this.msalInstance.handleRedirectPromise()
        },
        async onSubmitLogin(): Promise<void> {
            if (isUserNameValid(this.username) && this.password) {
                let form = new FormData()
                form.append('username', this.username)
                form.append('password', this.password)
                const userData = new URLSearchParams()
                for (const [key, value] of form) {
                    userData.append(key, value as string)
                }
                await this.authStore.login(userData)
                this.username = ''
                this.password = null
            } else {
                this.invalidFeedback()
            }
        },
        invalidFeedback() {
            if (!isUserNameValid(this.username)) {
                this.authStore.alert.error('Invalid username!');
                (document.getElementById('loginUsername') as HTMLInputElement).focus();
            } else {
                (document.getElementById('password') as HTMLInputElement).focus();
                this.authStore.alert.error('Password required!');
            }
        }
    },
    mounted() {
        this.handleMsalRedirect()
    },
    async created() {
        this.getAllProducts()
    }
})
</script>
