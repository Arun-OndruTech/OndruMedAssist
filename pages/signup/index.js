import image from '../../Images/login.jpg'
import Image from 'next/image';
import classes from '../login/login.module.css';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../firebase/Context/AuthContext';
import { useRouter } from 'next/router'
import Head from 'next/head';
import { auth } from '../../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import axios from 'axios';

export default function SignUp() {
    const emailRef = useRef();
    const userRef = useRef();
    const passRef = useRef();
    const conPassRef = useRef();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        if (passRef.current.value !== conPassRef.current.value) {
            return setError('Password do not match')
        }
        try {
            setError('')
            setLoading(true)
            const userCredential = await signup(emailRef.current.value, passRef.current.value)
            
            await updateProfile(auth.currentUser, {
                displayName: userRef.current.value
            })
            
            const { uid, email } = auth.currentUser;
            await axios.post('/api/User/addUser', { 
                displayName: auth.currentUser.displayName, 
                uid, 
                email 
            })
            
            router.push('/login')
        } catch (err) {
            console.error('Signup error:', err);
            switch (err.code) {
                case 'auth/email-already-in-use':
                    setError('Email already in use!')
                    break;
                case 'auth/weak-password':
                    setError('Length of password must be more than 6')
                    break;
                default:
                    setError(`Authentication failed: ${err.message}`)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <Head>
                <title>SignUp | MedAssist</title>
            </Head>
            <div className={classes.main_container}>
                <div className={classes.img_container}>
                    <Image
                        src={image}
                        height={700}
                        width={700}
                        alt="Login Image"
                    />
                </div>
                <div className={classes.outer_conatiner}>
                    <form onSubmit={handleSubmit}>
                        <h1>SignUp</h1>
                        {/* User-name */}
                        <div className={classes.username_con}>
                            <label htmlFor="username">Your UserName : </label>
                            <input ref={userRef} type="text" required id='username' placeholder='Username...' />
                        </div>
                        <div className={classes.email_con}>
                            <label htmlFor="email">Your Email : </label>
                            <input type="email" ref={emailRef} required id='email' placeholder='Email...' />
                        </div>
                        <div className={classes.pass_con}>
                            <label htmlFor="pass">Your Password : </label>
                            <input type="password" ref={passRef} autoComplete='true' required id='pass' placeholder='Password...' />
                        </div>
                        <div className={classes.pass_con}>
                            <label htmlFor="passConfirm">Confirm Password : </label>
                            <input type="password" ref={conPassRef} autoComplete='true' required id='passConfirm' placeholder='Confirm Password...' />
                        </div>
                        <label className={error === "" ? "hidden" : ""}>* {error}</label>
                        <button type='submit' disabled={loading} className={loading ? classes.disable : ""}>{loading ? "Loading..." : "SignUp"}</button>
                        <span>OR</span>
                        <Link href="/login" className={classes.reg}>Login</Link>
                    </form>
                </div>
            </div >
        </>
    )
}
