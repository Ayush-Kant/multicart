import { IOrder } from "@/models/order.model";
import { createSlice } from "@reduxjs/toolkit";





interface IuserSlice{
    allOrderData: IOrder[]
}

const initialState:IuserSlice = {
    allOrderData:[]
}
const orderSlice = createSlice({
    name:"order",
    initialState,
    reducers:{
    setAllOrderData:(state,action)=>{
        state.allOrderData = action.payload
    }

    }

    
})

export const {setAllOrderData} = orderSlice.actions

export default orderSlice.reducer