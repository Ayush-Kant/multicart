import { IProduct } from "@/models/product.model";
import { IUser } from "@/models/user.model";
import { createSlice } from "@reduxjs/toolkit";





interface IuserSlice{
    allVendorData: IUser[],
    allProductsData: IProduct[]
}

const initialState:IuserSlice = {
    allVendorData:[],
    allProductsData:[]
}
const vendorSlice = createSlice({
    name:"vendor",
    initialState,
    reducers:{
    setAllVendorData:(state,action)=>{
        state.allVendorData = action.payload
    },
    setAllProductsData:(state,action)=>{
      state.allProductsData = action.payload
    }

    }

    
})

export const {setAllVendorData} = vendorSlice.actions
export const {setAllProductsData} = vendorSlice.actions
export default vendorSlice.reducer