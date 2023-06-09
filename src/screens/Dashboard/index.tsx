import React,{useState, useEffect, useCallback} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {ActivityIndicator} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { useTheme } from "styled-components";

import { HighlightCard } from "../../components/HighlightCard";
import { TransactionCard, TransactionCardProps } from "../../components/TransactionCard";

import {
    Container,
    Header,
    UserWrapper,
    UserInfo,
    Photo,
    User,
    UserGreeting,
    UserName,
    LogoutButton,
    Icon,
    HighlightCards,
    Transactions,
    Title,
    TransactionList,
    LoadContainer,

} from "./style";
import { useAuth } from "../../hooks/auth";

export interface DataListProps extends TransactionCardProps{
    id: string;
}

interface HighlightData{
    entries: {
        amount: string,
        lastTransaction: string
    },
    expensives: {
        amount: string,
        lastTransaction: string
    },
    total: {
        amount: string,
        lastTransaction: string
    },
}

export function Dashboard(){
    const [isLoading,setIsLoading] = useState(true)
    const [data, setData] = useState<DataListProps[]>([])
    const [highlightData, sethighlightData] = useState<HighlightData>({} as HighlightData)

    const { user, signOut } = useAuth()

    const theme = useTheme()

    // Get the last transaction Date
    function getLastTransactionDate(collection: DataListProps[], type: 'positive' | 'negative'){
        
        const collectionFilttered = collection.filter((transaction) => transaction.type === type)
        
        if(collectionFilttered.length === 0){
            return 0
        }

        const lastTransaction = new Date(Math.max.apply(Math,collectionFilttered
            .map((transaction) => new Date(transaction.date).getTime())        
        ))

        return `${lastTransaction.getDate()} de ${lastTransaction.toLocaleString('pt-BR', { month: 'long'})}`
    }

    // Load data from asyncStorage and calculete the total amounts
    async function loadTransactions(){
        const dataKey = `@gofinances:transactions_user:${user.id}`
        const response = await AsyncStorage.getItem(dataKey)

        const transactions = response ? JSON.parse(response) : []

        let entriesTotal = 0
        let expensivesTotal = 0

        const transactionsFormatted: DataListProps[] = transactions.map((item: DataListProps) => {
            if(item.type === 'positive'){
                entriesTotal += Number(item.amount)
            }else{
                expensivesTotal += Number(item.amount)
            }

            const amount = Number(item.amount).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            })

            const date = Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit'
            }).format(new Date(item.date))

            return{
                id: item.id,
                name: item.name,
                amount,
                type: item.type,
                category: item.category,
                date
            }

        })

        setData(transactionsFormatted)

        const lastTransactionsEntries = getLastTransactionDate(transactions, 'positive')
        const lastTransactionsExpensives = getLastTransactionDate(transactions, 'negative')
        
        const totalInterval = lastTransactionsExpensives === 0 ? `` : `01 a ${lastTransactionsExpensives}`


        const total = entriesTotal - expensivesTotal

        sethighlightData({
            expensives:{
                amount: expensivesTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: lastTransactionsExpensives === 0 ? `Não já transações` : `Última saída dia ${lastTransactionsExpensives}`
            },
            entries:{
                amount: entriesTotal.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: lastTransactionsEntries === 0 ? `Não já transações` : `Última entrada dia ${lastTransactionsEntries}`
            },
            total:{
                amount: total.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }),
                lastTransaction: totalInterval
            }
        })

        setIsLoading(false)
    }

    useEffect(() => {
        loadTransactions()
    }, [])

    useFocusEffect(useCallback(() => {
        loadTransactions()
    },[]))

    return(
        <Container>
        {
            isLoading === true ? <LoadContainer><ActivityIndicator color={theme.colors.primary} size="large"/></LoadContainer> : 
            <>
           <Header>
            <UserWrapper>
                <UserInfo>
                    <Photo
                        source={{uri: user.photo}}
                    />
                    <User>
                        <UserGreeting>Olá, </UserGreeting>
                        <UserName>{user.name}</UserName>
                    </User>
                </UserInfo>
                <LogoutButton onPress={signOut}>
                    <Icon name="power" />
                </LogoutButton>
            </UserWrapper>
           </Header>

            <HighlightCards>
                <HighlightCard type="up" title="Entradas" amount={highlightData.entries.amount} lastTransaction={highlightData.entries.lastTransaction}/>
                <HighlightCard type="down" title="Saídas" amount={highlightData.expensives.amount} lastTransaction={highlightData.expensives.lastTransaction}/>
                <HighlightCard type="total" title="Total" amount={highlightData.total.amount} lastTransaction={highlightData.total.lastTransaction}/>
           </HighlightCards>

           <Transactions>
                <Title> Listagem </Title>
                <TransactionList
                    data={data}
                    keyExtractor={item => item.id}
                    renderItem={({item}) => <TransactionCard data={item} /> }
                />
           </Transactions>
           </>
           }
        </Container>
    )
}