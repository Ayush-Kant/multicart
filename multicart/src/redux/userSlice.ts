import { IUser } from "@/models/user.model";
import { createSlice } from "@reduxjs/toolkit";



interface IuserSlice{
    userData: IUser | null
}

const initialState:IuserSlice = {
    userData:null
}
const userSlice = createSlice({
    name:"user",
    initialState,
    reducers:{
    setUserData:(state,action)=>{
        state.userData = action.payload

    }
    }

    
})

export const {setUserData} = userSlice.actions
export default userSlice.reducer