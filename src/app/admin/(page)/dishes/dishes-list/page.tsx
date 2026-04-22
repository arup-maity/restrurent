"use client";
import React, { useContext, useState } from "react";

import { Plus } from "lucide-react";
import { useDebounceValue } from "usehooks-ts";

import Link from "next/link";
import { cn, handleApiError } from "@/utils";
import { IoIosSearch } from "react-icons/io";
import { adminInstance } from "@/config/axios";
import { IoEyeOutline } from "react-icons/io5";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { RiDeleteBinLine } from "react-icons/ri";
import { sessionContext } from "@/context/Session";
import Pagination from "@/components/common/Pagination";
import { Ability } from "@/authentication/AccessControl";
import { MdClose, MdOutlineModeEditOutline } from "react-icons/md";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useReactTable, getCoreRowModel, createColumnHelper, flexRender, ColumnDef, Column } from "@tanstack/react-table";
import DishService from "@/api-service/admin-service/dish/dish-service";
import { DishResponseType } from "@/api-service/admin-service/dish/dish.interface";

type Dish = DishResponseType;

const columnHelper = createColumnHelper<Dish>();

const DishesList = () => {
   // auth session
   const session = useContext(sessionContext);
   const [dishes, setDishes] = useState([]);
   // pagination
   const [totalItems, setTotalItems] = useState(0);
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage, setItemsPerPage] = useState(25);
   // filter
   const [clearSearch, setClearSearch] = useState(false);
   const [searchValue, setSearchValue] = useState("");
   const [debouncedValue, setValue] = useDebounceValue("", 1000);
   const [sort, setSort] = useState<{ column?: string; sortOrder?: string }>({});
   // delete rows
   const [deleteRows, setDeleteRows] = useState<number[]>([]);
   const [selectedAll, setSelectedAll] = useState(false);
   const [selectedRow, setSelectedRow] = useState<number[]>([]);

   function handleSearch(data: string) {
      setValue(data);
      setSearchValue(data);
      data === "" ? setClearSearch(false) : setClearSearch(true);
   }
   function handleClearSearch() {
      setValue("");
      setSearchValue("");
      setClearSearch(false);
   }

   const { data: DishList, isLoading } = useQuery({
      queryKey: ["admin-dish-categories", debouncedValue, currentPage, itemsPerPage, sort],
      queryFn: () =>
         DishService.getDish({
            page: currentPage,
            limit: itemsPerPage,
            search: debouncedValue,
            ...sort,
         }).then((res) => res.data),
   });

   const columns = [
      columnHelper.display({
         id: "select",
         header: () => <Checkbox checked={selectedAll} onCheckedChange={handleSelectedAll} />,
         cell: () => null,
         enableSorting: false,
         size: 50,
      }),
      columnHelper.display({
         id: "name",
         header: "Name",
         cell: (info) => (
            <div className="flex items-center gap-3">
               <Avatar>
                  <AvatarImage
                     src={info.row.original.thumbnail ? `${process.env.NEXT_PUBLIC_BUCKET_URL}${info.row.original.thumbnail}` : undefined}
                     alt={info.row.original.id.toString()}
                  />
                  <AvatarFallback>{info.row.original.id.toString().slice(0, 2)}</AvatarFallback>
               </Avatar>
               <span>{info.row.original.title}</span>
            </div>
         ),
         size: 250,
      }),
      columnHelper.accessor("nonVeg", {
         header: "Type",
         cell: (info) => (
            <div className="flex items-center justify-center">
               {info.getValue() ? (
                  <div className="w-6 h-6 flex items-center justify-center">
                     <div className="w-5 h-5 rounded border-2 border-red-600 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-red-600"></div>
                     </div>
                  </div>
               ) : (
                  <div className="w-6 h-6 flex items-center justify-center">
                     <div className="w-5 h-5 rounded border-2 border-green-600 flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                     </div>
                  </div>
               )}
            </div>
         ),
         size: 80,
      }),
      columnHelper.accessor("price", {
         header: "Price",
         cell: (info) => (
            <ul className="flex gap-2">
               <li className="text-base">{info.row.original.price}</li>
               <li className="text-base line-through opacity-70">{info.row.original.costPrice}</li>
            </ul>
         ),
         size: 100,
      }),
      columnHelper.display({
         id: "categories",
         header: "Category",
         cell: (info) => {
            const list = info.row.original.categories?.map((category) => category?.taxonomy?.name);
            return (
               <ul className="flex flex-wrap items-center">
                  {list?.map((category, index) => (
                     <li key={index}>
                        {index !== 0 && ", "}
                        {category}
                     </li>
                  ))}
               </ul>
            );
         },
         size: 200,
      }),
      columnHelper.accessor("slug", {
         header: "Slug",
         cell: (info) => <div>{info.getValue()}</div>,
         size: 250,
      }),

      columnHelper.display({
         id: "actions",
         header: "Options",
         cell: (info) => (
            <div className="flex items-center justify-center gap-4">
               <button>
                  <IoEyeOutline size={20} />
               </button>
               {Ability("update", "user", session?.user) && (
                  <Link href={`/admin/dishes/edit-dish?id=${info.row.original.id}`}>
                     <MdOutlineModeEditOutline size={20} />
                  </Link>
               )}
               {Ability("detele", "user", session?.user) && (
                  <Link href={`/admin/dishes/delete-dish?id=${info.row.original.id}`}>
                     <RiDeleteBinLine size={17} />
                  </Link>
               )}
            </div>
         ),
         size: 100,
      }),
   ];

   function handleSelectedRows(id: number, status: boolean) {
      setSelectedRow((prevData) => {
         const updatedSelectedRows = status ? [...prevData, id] : prevData.filter((item) => item !== id);

         const ids = DishList?.data?.map((item) => item.id) || [];
         setSelectedAll(ids.length === updatedSelectedRows.length && ids.sort().toString() === updatedSelectedRows.sort().toString());

         return updatedSelectedRows;
      });
   }

   function handleSelectedAll(status: boolean) {
      setSelectedRow(status ? DishList?.data?.map((item) => item.id) : []);
      setSelectedAll(status);
   }

   function getCommonPinningStyles<T>(column: Column<T, unknown>): React.CSSProperties {
      const isPinned = column.getIsPinned();

      return {
         position: isPinned ? "sticky" : "relative",
         left: isPinned === "left" ? `${column.getStart("left")}px` : undefined,
         right: isPinned === "right" ? `${column.getAfter("right")}px` : undefined,
         zIndex: isPinned ? 2 : 0,
      };
   }

   const table = useReactTable({
      data: DishList?.data ?? [],
      columns: columns as ColumnDef<Dish, unknown>[],
      manualPagination: true,
      getCoreRowModel: getCoreRowModel(),
      enableColumnPinning: true,
      initialState: {
         columnPinning: { left: ["select", "image"], right: ["actions"] },
      },
   });

   return (
      <div className="">
         <div className="mb-5">
            <div className="flex flex-wrap md:flex-nowrap items-center justify-between -m-2">
               <div className="w-full md:w-full p-2">
                  <div className="w-full flex items-center border-b-2 border-slate-200">
                     <IoIosSearch size={25} />
                     <input
                        type="text"
                        className="w-full h-9 focus:outline-none px-4"
                        placeholder="Search ..."
                        onChange={(event) => handleSearch(event.target.value)}
                        value={searchValue}
                     />
                     {clearSearch ? (
                        <div className="cursor-pointer" onClick={handleClearSearch}>
                           <MdClose color="#9a9b9c" />
                        </div>
                     ) : (
                        ""
                     )}
                  </div>
               </div>
               <div className="w-full md:w-auto flex justify-end gap-2 p-2">
                  {/* {
                     Ability('delete', 'city', session?.user) &&
                     deleteRows?.length > 0 && <button className=' text-base text-white font-montserrat font-medium whitespace-nowrap bg-red-500 border border-red-500 rounded py-1 px-4'>Delete Users</button>
                  } */}
                  {Ability("create", "dish", session?.user) && (
                     <Link
                        href="/admin/dishes/add-dish"
                        className="bg-black text-white text-sm flex items-center gap-2 whitespace-nowrap rounded-md py-2 px-4">
                        <Plus size={18} /> <span> Add Dish</span>
                     </Link>
                  )}
               </div>
            </div>
         </div>
         <div className="relative">
            <div className="overflow-x-auto overflow-y-auto custom-scroll-container max-h-[calc(100vh-230px)] 3xl:max-h-[calc(100vh-280px)] transition-all duration-300 ease-in-out hover:backdrop-blur-sm">
               <table className="w-full table-fixed border-collapse text-sm">
                  <thead className="bg-gray-200 border-b border-gray-100 sticky top-0 z-10">
                     {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                           {headerGroup.headers.map((header) => (
                              <th
                                 key={header.id}
                                 style={{
                                    ...getCommonPinningStyles(header.column),
                                    width: header.getSize(),
                                 }}
                                 className={cn(
                                    `text-left border-r last:border-none border-gray-100 text-lg font-normal px-3 py-1.5`,
                                    header.column.getIsPinned() && "bg-gray-200",
                                 )}>
                                 {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                              </th>
                           ))}
                        </tr>
                     ))}
                  </thead>
                  <tbody>
                     {isLoading ? (
                        [...Array(10)].map((_, index) => (
                           <tr key={index} className={`${index % 2 === 0 ? "bg-white" : "bg-gray-200"}`}>
                              {columns.map((_, colIndex) => (
                                 <td
                                    key={colIndex}
                                    className={cn(
                                       "border-r border-gray-100 p-2 py-3",
                                       colIndex === 0 && "sticky left-0 z-10",
                                       colIndex === columns.length - 1 && "sticky right-0 z-10",
                                       colIndex % 2 === 0 ? "bg-white" : "bg-[#FBFBFB]",
                                    )}>
                                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                                 </td>
                              ))}
                           </tr>
                        ))
                     ) : DishList?.data?.length === 0 ? (
                        <tr>
                           <td colSpan={columns.length}>
                              <div className="flex justify-center p-3">No data available</div>
                           </td>
                        </tr>
                     ) : (
                        table.getRowModel().rows.map((row, index) => (
                           <tr key={row.id} className={`group border-b border-gray-100 transition ${index % 2 === 0 ? "bg-white" : "bg-gray-100"}`}>
                              {row.getVisibleCells().map((cell) => (
                                 <td
                                    key={cell.id}
                                    style={{
                                       ...getCommonPinningStyles(cell.column),
                                       width: cell.column.getSize(),
                                    }}
                                    className={cn(
                                       `border-r last:border-none border-gray-200 p-2 group-hover:bg-gray-200`,
                                       cell.column.getIsPinned() && (index % 2 === 0 ? "bg-white" : "bg-white"),
                                    )}>
                                    {cell.column.id === "select" ? (
                                       <Checkbox
                                          checked={selectedRow.includes(row.original.id)}
                                          onCheckedChange={(e: boolean) => handleSelectedRows(row.original.id, e)}
                                       />
                                    ) : (
                                       flexRender(cell.column.columnDef.cell, cell.getContext())
                                    )}
                                 </td>
                              ))}
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 mt-4">
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
                     <p className="text-sm text-gray-600">
                        Showing {itemsPerPage * (currentPage - 1) + 1} - {Math.min(itemsPerPage * currentPage, totalItems)} of {totalItems} results
                     </p>
                  </div>
               )}
               <div className="max-md:w-full max-md:flex max-md:justify-center">
                  <Pagination totalItems={totalItems} perPage={itemsPerPage} currentPage={currentPage} onChange={(e) => setCurrentPage(e)} />
               </div>
            </div>
         </div>
      </div>
   );
};

export default DishesList;
