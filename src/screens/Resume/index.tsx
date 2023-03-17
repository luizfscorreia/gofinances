import React, {useEffect, useState, useCallback} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { VictoryPie } from 'victory-native'
import { useFocusEffect } from '@react-navigation/native'
import { addMonths,subMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Container,
    Header,
    Title,
    LoadContainer,
    Content,
    ChartContainer,
    MonthSelect,
    MonthSelectButton,
    MonthSelectIcon,
    Month,
} from "./styles";
import { categories } from "../../utils/categories";
import { RFValue } from "react-native-responsive-fontsize";

import { HistoryCard } from "../../components/HistoryCard";
import { useTheme } from "styled-components/native";
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { ActivityIndicator } from "react-native";
import { useAuth } from "../../hooks/auth";

interface TransactionData {
    type: 'positive' | 'negative';
    name: string;
    amount: string;
    category: string;
    date: string;
}

interface categoryDate{
    key: string;
    name: string;
    total: Number;
    totalFormatted: string;
    color: string;
    percent: string;
}

export function Resume(){
    const theme = useTheme()

    const { user } = useAuth()

    const [isLoading, setIsLoading] = useState(true)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [totalByCategories, setTotalByCategories] = useState<categoryDate[]>([])

    function handleDateChange(action: 'next' | 'prev'){
        if(action === 'next'){
            setSelectedDate(addMonths(selectedDate, 1))
        }else{
            setSelectedDate(subMonths(selectedDate, 1))
        }
    }

    async function loadData(){
        if(!isLoading){
            setIsLoading(true)
        }
        const dataKey = `@gofinances:transactions_user:${user.id}`
        const response = await AsyncStorage.getItem(dataKey)
        const responseFormatted = response ? JSON.parse(response) : []

        const expensives = responseFormatted
        .filter((expensive: TransactionData) => 
            expensive.type === 'negative' &&
            new Date(expensive.date).getMonth() === selectedDate.getMonth() &&
            new Date(expensive.date).getFullYear() === selectedDate.getFullYear()
        )
       
        const expensivesTotal = expensives.reduce((acumullator: number, expensive: TransactionData) => {
            return acumullator + Number(expensive.amount)
        }, 0)

        const totalByCategory: categoryDate[] = []
       
        categories.forEach(category => {
            let categorySum = 0

            expensives.forEach((expensive: TransactionData) => {
                if(expensive.category === category.key){
                    categorySum += Number(expensive.amount)
                }
            })

            const percent = `${(categorySum / expensivesTotal * 100).toFixed(0)}%`

            if(categorySum > 0){
                totalByCategory.push({
                    key: category.key,
                    name: category.name,
                    total: categorySum,
                    totalFormatted: categorySum.toLocaleString('pt-BR',{style: 'currency', currency: 'BRL'}),
                    color: category.color,
                    percent
                })
            }
        })
        setTotalByCategories(totalByCategory)
        setIsLoading(false)
    }

    useFocusEffect(useCallback(()=>{
        loadData()
    },[selectedDate]))

    return(
        <Container>
            <Header>
                <Title> Resumo por categoria </Title>
            </Header>

            {
                isLoading ? 
                    <LoadContainer>
                        <ActivityIndicator
                            color={theme.colors.primary}
                            size='large'
                        />
                    </LoadContainer> :
                <Content
                    showsHorizontalScrollIndicator={false}
                    style={{
                        flex: 1,
                        paddingHorizontal: 24,
                        paddingBottom: useBottomTabBarHeight(),
                        
                    }}
                >

                <MonthSelect>
                    <MonthSelectButton onPress={() => handleDateChange('prev')}>
                        <MonthSelectIcon name="chevron-left"/>
                    </MonthSelectButton>

                    <Month>{format(selectedDate, 'MMMM, yyyy', {locale: ptBR})}</Month>

                    <MonthSelectButton onPress={() => handleDateChange('next')}>
                        <MonthSelectIcon name="chevron-right"/>
                    </MonthSelectButton>
                </MonthSelect>

                <ChartContainer>
                    <VictoryPie
                        data={totalByCategories}
                        colorScale={totalByCategories.map(category => category.color)}
                        style={{
                            labels: {
                                fontSize: RFValue(18),
                                fontWeight: 'bold',
                                fill: theme.colors.shape
                            }
                        }}
                        labelRadius={50}
                        x="percent"
                        y="total"
                    />
                </ChartContainer>

                {
                    totalByCategories.map(item => (
                        <HistoryCard key={item.key} title={item.name} amount={item.totalFormatted} color={item.color} />
                    ))
                }
                </Content>
            }
        </Container>
    )
}