// src/app/hooks.ts
import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './store'

// Use these custom hooks throughout your app instead of plain useDispatch/useSelector
// They provide full TypeScript type safety without the old TypedUseSelectorHook

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()