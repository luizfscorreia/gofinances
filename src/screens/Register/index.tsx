import React,{useState} from 'react'
import { 
    Keyboard,
    Modal,
    TouchableWithoutFeedback,
    Alert
} from 'react-native'
import * as Yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import AsyncStorage from '@react-native-async-storage/async-storage'
import uuid from 'react-native-uuid'

import {useForm} from 'react-hook-form'
import { useNavigation } from '@react-navigation/native'

import { Button } from '../../components/Forms/Button'
import { CategorySelectButton } from '../../components/Forms/CategorySelectButton'
import { InputForm } from '../../components/Forms/InputForm'
import { TransactionTypeButton } from '../../components/Forms/TransactionTypeButton'
import { CategorySelect } from '../CategorySelect'

import {
    Container,
    Header,
    Title,
    Form,
    Fields,
    TransactionsTypes,
} from './styles'
import { useAuth } from '../../hooks/auth'

export interface FormData{
    [name: string]: string,
}

interface NavigationProps {
    navigate:(screen:string) => void
}

const schema = Yup.object().shape({
    name: Yup.string().min(3, 'O nome precisa ter no mínimo 3 caracteres.').required('Nome é obrigatório.'),
    amount: Yup
    .number()
    .typeError('Informe um valor númerico.')
    .positive('O valor não pode ser negativo.')
    .required('O valor é obrigatório.')
})

export function Register(){

    const navigation = useNavigation<NavigationProps>()

    const {user} = useAuth()

    const [transactionType, setTransactionType] = useState('')
    const [categoryModalOpen, setCategoryModalOpen] = useState(false)
    const [category, setCategory] = useState({
        key: 'category',
        name: 'Categoria'
    })

    const {control, handleSubmit, formState: {errors}, reset} = useForm<FormData>({
        resolver: yupResolver(schema)
    })

    function handleTransactionTypeSelect(type: 'positive' | 'negative'){
        setTransactionType(type)
    }

    async function handleRegister(form: FormData){
        
        if(!transactionType){
            return Alert.alert('Selecione o tipo da transação')
        }

        if(category.key === 'category'){
            return Alert.alert('Selecione o tipo da transação')
        }

        const newTransaction = {
            id: String(uuid.v4()),
            name: form.name,
            amount: form.amount,
            type: transactionType,
            category: category.key,
            date: new Date(),
        }

        try {
            const dataKey = `@gofinances:transactions_user:${user.id}`

            const data = await AsyncStorage.getItem(dataKey)
            const currenteData = data ? JSON.parse(data) : []

            const newData = [
                ...currenteData,
                newTransaction
            ]

            await AsyncStorage.setItem(dataKey, JSON.stringify(newData))

            reset()
            setTransactionType('')
            setCategory({
                key: 'category',
                name: 'Categoria'
            })
            
            navigation.navigate('Listagem')

        } catch (error) {
            console.log(error)
            Alert.alert("Não foi possível salvar")
        }
    }

    return(
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Container>
            <Header>
                <Title> Cadastro </Title>
            </Header>

            <Form>
                <Fields>
                    <InputForm
                        control={control}
                        name="name"
                        placeholder='Nome'
                        autoCapitalize='sentences'
                        autoCorrect={false}
                        error={errors.name && errors.name.message}
                    />
                    <InputForm
                        control={control}
                        name="amount"
                        placeholder='Preço'
                        keyboardType='numeric'
                        error={errors.amount && errors.amount.message}
                    />

                    <TransactionsTypes>
                        <TransactionTypeButton type="up" title='Income' isActive={transactionType === 'positive'} onPress={() => handleTransactionTypeSelect('positive')}/>
                        <TransactionTypeButton type='down' title='Outcome' isActive={transactionType === 'negative'} onPress={() => handleTransactionTypeSelect('negative')} />
                    </TransactionsTypes>
                    <CategorySelectButton
                        title={category.name}
                        onPress={() => setCategoryModalOpen(true)}
                    />
                </Fields>
                <Button title='Enviar' onPress={handleSubmit(handleRegister)}/>
            </Form>

            <Modal
                visible={categoryModalOpen}
            >
                <CategorySelect
                    category={category}
                    setCategory={setCategory}
                    closeSelectCategory={() => setCategoryModalOpen(false)}
                />
            </Modal>
        </Container>
        </TouchableWithoutFeedback>
    )
}