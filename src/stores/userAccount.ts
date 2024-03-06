import { defineStore } from 'pinia';
import { axiosInstance } from '@/helpers/axiosHttp';
import { userAuthStore } from '@/stores/auth_store'
import router from '@/router/index'
import type { User, Enquiry, Booking, Registration } from '@/helpers/my-types';
import Swal from 'sweetalert2/dist/sweetalert2.js'

import { userAlertStore } from './alert';
export const userStore = defineStore({
    id: 'users',
    state: () => ({
        users: [] as User[], emailSent: false, user: null as User | null, bookingsHistory: [] as Booking | [], alertStore: userAlertStore(), authStore: userAuthStore()
    }),
    actions: {
        async getUsers() {
            try {
                const response = await axiosInstance.get('users');
                if (!response.data.success) {
                    this.alertStore.error(response.data.message || 'Couldnt get Users');
                    return;
                }
                this.users = response.data.result;

            } catch (error: any) {
                console.log(error);
            }
        },
        async reSendOtpEmail(email: string) {
            try {
                const response = await axiosInstance.get('users/signup/resendOtp', { params: { "email": email } });
                if (response.data.success) {
                    console.log(response.data.result);
                    this.emailSent = true;
                    //return router.replace({ name: 'Confirm', query: response.data.result })
                } else {
                    this.alertStore.error(response.data.result);
                }

            } catch (error: any) {
                console.log(error);
            }

        },
        async confirmOtpToken(token: string) {
            try {
                token = token.trim();
                const response = await axiosInstance.get('users/signup/verify-otp', { params: { "otp": token } });
                if (!response.data.success) {
                    console.log(response.data.result);
                    return;
                }
                console.log(response.data.result)
                //return router.replace({ name: 'Confirm' })
            } catch (error: any) {
                console.error(error);

            }
        },

        async confirmPasswordResetToken(token: string) {
            try {
                token = token.trim();
                const response = await axiosInstance.get('users/reset/confirm-token', { params: { "otp": token } });
                if (!response.data.success) {
                    console.log(response.data.result);
                    return;
                }
                console.log(response.data.result)
                //return router.replace({ name: 'Confirm' })
            } catch (error: any) {
                console.error(error);

            }
        },
        async signUP(user: Registration) {
            try {
                const response = await axiosInstance.post('users/signup', user);
                if (!response.data.success) {
                    this.alertStore.error(response.data.message || 'Registration unsuccessful!');
                    return;
                }
                this.emailSent = true;
                router.replace({ name: 'OtpEmail', query: response.data.result })
            } catch (error: any) {
                console.error(error);
            }

        },
        async customerEnquiry(enquiry: Enquiry) {
            try {
                const response = await axiosInstance.post('users/customer/service', enquiry);
                if (!response.data.success) {
                    this.alertStore.error(response.data.message || 'Operation unsuccessful');
                    return;
                }
                this.alertStore.success('Your enquiry is submitted!' + " Please contact us with this number " + response.data.result);
            } catch (error: any) {
                console.log(error);
            }

        },
        async sendPasswordResetToken(email: string) {
            try {
                const response = await axiosInstance.get('users/reset/password', { params: { email: email } });
                if (!response.data.success) {
                    this.alertStore.error(response.data.message || 'Operation unsuccessful');
                    return;
                }
                this.alertStore.success('Your password change request was submitted!' + " Please check your email ");
                this.emailSent = true;
            } catch (error: any) {
                console.log(error);
            }
        },
        async getUserById(userid: string) {
            try {
                const response = await axiosInstance.get('users/' + userid);
                if (!response.data.success) {
                    this.alertStore.error(response.data.message || 'Operation unsuccessful');
                    return;
                }
                this.user = response.data.result
                this.bookingsHistory = response.data.result.bookings

            } catch (error: any) {
                console.error(error);
            }

        },
        async enableExternalLogin(username: string) {
            try {
                const response = await axiosInstance.put('users/enable/' + username);
                if (!response.data.success) {
                    this.alertStore.error(response.data.message || 'Operation unsuccessful');
                    (<HTMLInputElement>document.getElementById('alert1')).scrollIntoView();
                    return;
                }
                this.user = response.data.result
                this.alertStore.success("External login : " + this.user?.using2FA);
                (<HTMLInputElement>document.getElementById('alert1')).scrollIntoView();
            } catch (error: any) {
                console.error(error);
            }

        },
        async updateUserById(userid: string, new_data: any) {
            try {
                const response = await axiosInstance.put('users/' + userid, new_data);
                if (!response.data.success) {
                    this.alertStore.error(response.data.message || 'Operation unsuccessful');
                    (<HTMLInputElement>document.getElementById('alert1')).scrollIntoView();
                    return;
                }

                if (userid === this.authStore.user.userid) {
                    const user = { ...this.authStore.user, ...new_data };
                    localStorage.setItem('user', JSON.stringify(user));
                    this.authStore.user = user;
                }
            } catch (error: any) {
                console.error(error);
            }

        },

        async deleteUserAccount(userid: string) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                allowOutsideClick: false,
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!',
                imageUrl: new URL('../../src/assets/images/ai.jpg', import.meta.url).href,
                imageWidth: 400,
                imageHeight: 200,
                imageAlt: 'Custom image',
            }).then(async (result: any) => {
                if (result.isConfirmed) {
                    try {
                        const response = await axiosInstance.delete('users/' + userid);
                        if (!response.data.success) {
                            this.alertStore.error(response.data.message || 'Operation unsuccessful');
                            return;
                        }
                        // remove user from list after deleted
                        this.users = this.users.filter(x => x.userid !== userid);//Shallow copy
                        if (userid === this.authStore.user.userid) this.authStore.logout();
                        Swal.fire('Deleted!', 'Your account has been deleted.', 'success');

                    } catch (error: any) {
                        console.log(error);
                    }

                }
            })

        },

    }

});