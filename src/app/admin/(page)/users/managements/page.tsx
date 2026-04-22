"use client";
import React, { useContext, useEffect, useState } from "react";
import { useDebounceValue } from "usehooks-ts";
import Link from "next/link";
import { adminInstance } from "@/config/axios";
import { Button } from "@/components/ui/button";
import { AiOutlinePlus } from "react-icons/ai";
import { RiDeleteBinLine } from "react-icons/ri";
import { sessionContext } from "@/context/Session";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import Pagination from "@/components/common/Pagination";
import { HiOutlineDotsVertical } from "react-icons/hi";
import { Ability } from "@/authentication/AccessControl";
import EditUser from "@/admin-components/users/edit-user";
import { SearchInput } from "@/components/ui/input";
import { MdOutlineModeEditOutline } from "react-icons/md";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const Managements = () => {
   const session = useContext(sessionContext);
   const [editUserForm, setEditUserForm] = useState(false);
   // selected row
   const [selectedAll, setSelectedAll] = useState(false);
   const [selectedRow, setSelectedRow] = useState<number[]>([]);
   // pagination
   const [currentPage, setCurrentPage] = useState<number>(1);
   const [itemsPerPage, setItemsPerPage] = useState<number>(5);
   const [totalItems, setTotalItems] = useState<number>(0);
   // searching
   const [searchTerm, setSearchTerm] = useState("");
   const [debouncedValue, setValue] = useDebounceValue(searchTerm, 1000);

   //
   const [users, setUser] = useState([]);

   // get user list
   const { data, isLoading } = useQuery({
      queryKey: ["user-list", debouncedValue, currentPage, itemsPerPage],
      queryFn: () =>
         adminInstance
            .get(`/user/user-list`, {
               params: {
                  search: debouncedValue,
                  page: currentPage,
                  limit: itemsPerPage,
               },
            })
            .then((res) => res.data),
   });
   useEffect(() => {
      if (data?.data?.users) {
         setUser(data?.data.users);
         setTotalItems(data?.data.pagination?.total || 0);
      }
   }, [data?.data]);

   function handleSelectedRows(id: number, status: boolean) {
      setSelectedRow((prevData) => {
         const updatedSelectedRows = status ? [...prevData, id] : prevData.filter((item) => item !== id);
         const ids = users?.map((item) => item.id) || [];
         setSelectedAll(ids.length === updatedSelectedRows.length && ids.sort().toString() === updatedSelectedRows.sort().toString());
         return updatedSelectedRows;
      });
   }

   function handleSelectedAll(status: boolean) {
      setSelectedRow(status ? users?.map((item) => item.id) : []);
      setSelectedAll(status);
   }

   return (
      <div className="w-full bg-white border border-gray-200 rounded-xl p-6">
         <div className="mb-4">
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between">
               <div className="">
                  <div className="text-2xl font-semibold">User List</div>
               </div>
               <div className="flex items-center gap-4">
                  <SearchInput placeholder="Search ..." className="w-80" value={searchTerm} onChange={setSearchTerm} />
                  <Button onClick={() => setEditUserForm((prev) => !prev)}>
                     <AiOutlinePlus />
                     Add User
                  </Button>
               </div>
            </div>
         </div>
         <div className="w-full">
            <table className="w-full">
               <thead className="bg-gray-100">
                  <tr>
                     <th className="w-14 text-left border text-lg font-normal px-3 py-1">
                        <Checkbox checked={selectedAll} onCheckedChange={handleSelectedAll} />
                     </th>
                     <th className="w-64 text-left border text-base font-normal px-3 py-1">Name</th>
                     <th className="w-auto text-left border text-base font-normal px-3 py-1">Email</th>
                     <th className="w-44 text-left border text-base font-normal px-3 py-1">Role</th>
                     <th className="w-20 text-left border text-base font-normal px-3 py-1">Option</th>
                  </tr>
               </thead>
               <tbody>
                  {isLoading ? (
                     [...Array(8)].map((_, index) => (
                        <tr key={index} className={`${index % 2 === 0 ? "bg-white" : "bg-[#FBFBFB]"}`}>
                           <td className="border px-3 py-2">
                              <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                           </td>
                           <td className="text-base border py-1 px-3">
                              <div className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                           </td>
                           <td className="text-base border py-1 px-3">
                              <div className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                           </td>
                           <td className="text-base border py-1 px-3">
                              <div className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                           </td>
                           <td className="text-base border py-1 px-3">
                              <div className="h-6 w-full bg-gray-200 rounded animate-pulse"></div>
                           </td>
                        </tr>
                     ))
                  ) : users?.length === 0 ? (
                     <tr>
                        <td colSpan={5}>
                           <div className="flex justify-center p-3">No data available</div>
                        </td>
                     </tr>
                  ) : (
                     users?.map((row: any, index: number) => (
                        <tr key={row?.id} className={`border ${index % 2 === 0 ? "bg-white" : "bg-[#FBFBFB]"}`}>
                           <td className="border py-1 px-3">
                              <Checkbox checked={selectedRow.includes(row.id)} onCheckedChange={(e: boolean) => handleSelectedRows(row.id, e)} />
                           </td>
                           <td className="text-base border py-1 px-3">
                              {row?.firstName} {row?.lastName}
                           </td>
                           <td className="text-base border py-1 px-3">{row?.email}</td>
                           <td className="text-base border py-1 px-3">{row?.role}</td>
                           <td className="text-base border py-1 px-3">
                              <Popover>
                                 <PopoverTrigger asChild>
                                    <Button variant="ghost">
                                       <HiOutlineDotsVertical />
                                    </Button>
                                 </PopoverTrigger>
                                 <PopoverContent className="w-40 p-2" align="end">
                                    <ul className="space-y-2">
                                       <li>
                                          {Ability("update", "user", session?.user) && (
                                             <Link
                                                href={`/admin/users/managements/edit-user?edit=true&id=${row?.id} `}
                                                className="flex items-center gap-2 whitespace-nowrap">
                                                <MdOutlineModeEditOutline size={20} />
                                                Update user
                                             </Link>
                                          )}
                                       </li>
                                       <li>
                                          {Ability("detele", "user", session?.user) && (
                                             <Link
                                                href={`/admin/users/managements/delete-user?delete=true&id=${row?.id}`}
                                                className="flex items-center gap-2 whitespace-nowrap">
                                                <RiDeleteBinLine size={17} />
                                                Delete user
                                             </Link>
                                          )}
                                       </li>
                                    </ul>
                                 </PopoverContent>
                              </Popover>
                           </td>
                        </tr>
                     ))
                  )}
               </tbody>
            </table>
            <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
               {totalItems !== 0 && (
                  <div className="flex items-center gap-4">
                     <select
                        onChange={(e: any) => setItemsPerPage(e.target.value)}
                        className="h-7 text-base border border-slate-400 focus:outline-none rounded px-1">
                        <option value={5}>5</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                     </select>
                     <p className="text-base text-gray-600">
                        Showing {itemsPerPage * (currentPage - 1) + 1} - {Math.min(itemsPerPage * currentPage, totalItems)} of {totalItems} results
                     </p>
                  </div>
               )}
               <div className="max-md:w-full max-md:flex max-md:justify-center">
                  <Pagination totalItems={totalItems} perPage={itemsPerPage} currentPage={currentPage} onChange={(e) => setCurrentPage(e)} />
               </div>
            </div>
         </div>
         <EditUser open={editUserForm} close={() => setEditUserForm((prev) => !prev)} userDetails={{}} />
      </div>
   );
};

export default Managements;
