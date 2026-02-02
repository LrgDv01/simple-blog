import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

// Typed hooks for Redux
export const useAppDispatch = useDispatch.withTypes<AppDispatch>() // Corrected to use AppDispatch
export const useAppSelector = useSelector.withTypes<RootState>() // Corrected to use RootState