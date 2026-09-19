import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice"
import vendorSlice from "./vendorSlice"
import orderSlice from "./orderSlice"
export const store = configureStore({
    reducer:{
        user:userSlice,
        vendor:vendorSlice,
        order:orderSlice

    }

})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch