'use client'
import { axiosInstance } from '@/config/axios'
import { handleApiError } from '@/utils'
import { useRouter } from 'next/navigation'
import React, { useLayoutEffect, useState } from 'react'
import { BsArrowLeft } from 'react-icons/bs'
import { toast } from 'sonner'

const DeleteDish = ({ searchParams }: { searchParams: object }) => {
   const id = searchParams.id || ''
   const router = useRouter()
   const [dishDetails, setDishDetails] = useState<{ [key: string]: any }>({})
   useLayoutEffect(() => {
      getDishDetails(id)
   }, [id])
   async function getDishDetails(id: string) {
      try {
         const res = await axiosInstance.get(`/dishes/read-dish/${id}`)
         if (res.data.success) {
            setDishDetails(res.data.dish)
         }
      } catch (error) {
         handleApiError(error)
      }
   }
   async function handleDelete() {
      try {
         const res = await axiosInstance.delete(`/dishes/delete-dish/${id}`, { params: { thumbnail: dishDetails.thumbnail } })
         if (res.data.success) {
            toast.success('Delete successfully')
            router.back()
         }
      } catch (error) {
         handleApiError(error)
      }
   }
   return (
      <div className='bg-white rounded p-4'>
         <div className="mb-4">
            <div className="">
               <div role='button' className="inline-flex hover:bg-gray-200 items-center flex-nowrap gap-2 rounded-full px-3 -ms-3" onClick={() => router.back()}>
                  <span className="cursor-pointer"><BsArrowLeft size={20} /></span>
                  <h1 className="text-lg font-medium">Delete Dish</h1>
               </div>
            </div>
            <p className='text-base opacity-50'>Are you sure you want to delete the dish</p>
         </div>
         <div className="mb-4">
            <div className="text-lg">{dishDetails.title}</div>
            <ul className='flex items-center gap-4'>
               <li className='text-base'>{dishDetails.price}</li>
               <li className='text-base opacity-60 line-through'>{dishDetails.costPrice}</li>
            </ul>
         </div>
         <div className="">
            <button type="button" className='text-sm border border-slate-400 rounded py-1.5 px-4' onClick={handleDelete}>Delete Dish</button>
         </div>
      </div>
   )
}

export default DeleteDish