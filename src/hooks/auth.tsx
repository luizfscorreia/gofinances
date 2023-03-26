import {createContext, ReactNode, useContext, useState, useEffect} from 'react'
import * as AuthSession from 'expo-auth-session'
import { AppleAuthenticationScope, signInAsync } from 'expo-apple-authentication'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserInfo } from '../screens/Dashboard/style'

import * as Google from 'expo-auth-session/providers/google'

interface AuthProviderProps{
    children: ReactNode
}

interface User{
    id: string;
    name: string;
    email: string;
    photo?: string;
}

interface IAuthContextData{
    user: User
    signInWithGoogle(): Promise<void>
    signInWithApple(): Promise<void>
    signOut(): Promise<void>
    GoogleSignIn(): Promise<void>
    getUserData(accessToken:any): Promise<void>
    userStorageLoading: boolean
}

interface AuthorizationResponse{
    params: {
        access_token: string;
    };
    type: string;
}

const AuthContext = createContext({} as IAuthContextData)

function AuthProvider({children}: AuthProviderProps){

    const { CLIENT_ID } = process.env
    const { REDIRECT_URI } = process.env

    const [user, setUser] = useState<User>({} as User)
    const [token, setToken] = useState<string | null>()
    const [userStorageLoading, setUserStorageLoading] = useState(true)

    async function signInWithGoogle(){
        try {
            const RESPONSE_TYPE = 'token';
            const SCOPE = encodeURI('profile email')

            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}&scope=${SCOPE}`

            const {type, params} = await AuthSession.startAsync({authUrl}) as AuthorizationResponse

            if(type === 'success'){
                const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${params.access_token}`)
                const userInfo = await response.json()

                const userLogged = {
                    id: userInfo.id,
                    email: userInfo.email,
                    name: userInfo.given_name,
                    photo: userInfo.picture
                }

                setUser(userLogged)
                await AsyncStorage.setItem('@gofinances:user', JSON.stringify(userLogged))
            }

        } catch (error: any) {
            throw new Error(error)
        }
    }

    async function signInWithApple() {
        try {
            const credential = await signInAsync({
                requestedScopes: [
                    AppleAuthenticationScope.FULL_NAME,
                    AppleAuthenticationScope.EMAIL,
                ]
            })

            if(credential){
                const userLogged = {
                        id: String(credential.user),
                        email: credential.email!,
                        name: credential.fullName!.givenName!,
                        photo: `https://ui-avatars.com/api/?name=${credential.fullName!.givenName!}&length=1`
                }

                setUser(userLogged)
                await AsyncStorage.setItem('@gofinances:user', JSON.stringify(userLogged))
            }

        } catch (error) {
            throw new Error(error as any)
        }
    }

    async function signOut(){
        setUser({} as User)
        await AsyncStorage.removeItem('@gofinances:user')
    }

    useEffect(() => {
        async function loadUserStorageDate(){
            const userStorage = await AsyncStorage.getItem('@gofinances/user')
            
            if(userStorage){
                const userLogged = JSON.parse(userStorage) as User
                setUser(userLogged)
            }
            setUserStorageLoading(false)
        }

        loadUserStorageDate()
    }, [])


    async function getUserData(accessToken:any){
        let userInfoResponse = await fetch(
            "https://www.googleapis.com/userinfo/v2/me", {
                headers: { Authorization: `Bearer ${accessToken}` }
            }
        )
        const userInfo = await userInfoResponse.json()

        setUser({
            id: UserInfo.displayName!,
            name: userInfo.given_name,
            email: userInfo.email,
            photo: userInfo.picture,
        })

        await AsyncStorage.setItem("@gofinances:user", JSON.stringify(user));
    }

    const [request, response, promptAsync] = Google.useAuthRequest({
        expoClientId: CLIENT_ID,
        androidClientId: CLIENT_ID,
        iosClientId: CLIENT_ID,
        scopes: ['profile','email'],
        redirectUri: REDIRECT_URI
      });

    async function GoogleSignIn(){
        await promptAsync()
    }

    const getUserInfo = async () => {
        try {
            const response = await fetch(
                "https://www.googleapis.com/userinfo/v2/me",
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              const user = await response!.json()
              setUser({
                  id: user.id,
                  name:user.given_name,
                  email: user.email,
                  photo: user.picture
              })

        } catch (error) {
            console.log('Error ao recuperar dados')
        }
    }

    useEffect(() => {
        if(response?.type === 'success'){
            setToken(response.authentication!.accessToken)
            getUserInfo()

        }
    }, [response, token])

    return (
        <AuthContext.Provider value={{user, signInWithGoogle, signInWithApple, signOut,GoogleSignIn, getUserData, userStorageLoading}}>
            {children}
        </AuthContext.Provider>
    )
}

function useAuth(){
    const context = useContext(AuthContext)

    return context
}

export{ AuthProvider, useAuth }
