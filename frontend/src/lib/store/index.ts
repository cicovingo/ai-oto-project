import { configureStore } from "@reduxjs/toolkit";
import { flowmindApi } from "@/lib/store/api";
import workflowsReducer from "@/lib/store/workflows-slice";

export const makeStore = () =>
  configureStore({
    reducer: {
      workflows: workflowsReducer,
      [flowmindApi.reducerPath]: flowmindApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(flowmindApi.middleware),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
