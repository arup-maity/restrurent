"use client";
import React, { useLayoutEffect, useState } from "react";

import { z } from "zod";
import { toast } from "sonner";
import { Controller, SubmitHandler, useForm } from "react-hook-form";

import { useSearchParams } from "next/navigation";
import { adminInstance } from "@/config/axios";
import { Button } from "@/components/ui/button";
import { useMutation, useQueries } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { blobToImage, handleApiError } from "@/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import ImageUpload from "@/components/thumbnail/ImageUpload";
import { MultiSelect } from "@/components/common/multi-select";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { Card, CardContent } from "@/components/ui/card";

const schemaValidation = z.object({
   title: z.string().min(2, "Please enter title"),
   slug: z
      .string()
      .min(2, "Slug must be at least 2 characters long")
      .regex(/^[a-z0-9-]+$/, {
         message: "Slug must contain only lowercase letters, hyphen and numbers, and must not contain any whitespace or uppercase letters.",
      }),
   description: z.string().min(10, "Description must be at least 10 characters long"),
   shortDescription: z.string().min(10, "Description must be at least 10 characters long"),
   price: z.number().gt(0),
   costPrice: z.number().gt(0),
   nonVeg: z.boolean(),
   category: z.array(z.number()).optional(),
   thumbnail: z.string(),
});

type DishFormType = z.infer<typeof schemaValidation>;

const AddCategory = () => {
   const query = useSearchParams();
   const dishId = query?.get("id") || "";
   //
   const [categoryList, setCategoryList] = useState([]);
   const [originalThumbnail, setOriginalThumbnail] = useState("");
   const defaultValues = {
      title: "",
      slug: "",
      description: "",
      shortDescription: "",
      price: 0,
      costPrice: 0,
      nonVeg: false,
      category: [],
      thumbnail: "",
   };

   const {
      handleSubmit,
      control,
      setValue,
      watch,
      formState: { errors },
   } = useForm<DishFormType>({
      defaultValues,
      mode: "onSubmit",
      resolver: zodResolver(schemaValidation),
   });
   const dishTitle = watch("title");
   useLayoutEffect(() => {
      function formatSlug(input: string) {
         let formatted = input.replace(/[^\w\s-]/g, "");
         formatted = formatted.replace(/\s+/g, "-");
         formatted = formatted.toLowerCase();
         return formatted;
      }
      const CategorySlug = formatSlug(dishTitle);
      setValue("slug", CategorySlug);
   }, [dishTitle]);

   const createDishMutation = useMutation({
      mutationKey: ["create-dish"],
      mutationFn: (data: DishFormType) => adminInstance.post(`/dish-service/create-dish`, data).then((res) => res.data),
      onSuccess: (data) => {
         if (data.success) {
            toast.success(data?.message);
         }
      },
      onError: (error) => {
         console.log(error);
      },
   });
   const updateDishMutation = useMutation({
      mutationKey: ["update-dish"],
      mutationFn: (data: DishFormType) => adminInstance.put(`/dish-service/update-dish/${dishId}`, data).then((res) => res.data),
      onSuccess: (data) => {
         if (data.success) {
            toast.success(data?.message);
         }
      },
      onError: (error) => {
         console.log(error);
      },
   });

   const onSubmit: SubmitHandler<DishFormType> = async (data) => {
      let dishData = data;

      // Only upload if thumbnail is a new image (starts with "data:image") and different from original
      const hasNewImage = data?.thumbnail.startsWith("data:image");
      const imageChanged = data.thumbnail !== originalThumbnail;

      if (hasNewImage && imageChanged) {
         try {
            const fileUrl = await blobToImage(data.thumbnail);
            const formData = new FormData();
            formData.append("image", fileUrl);
            const response = await adminInstance.post(`/dish-service/thumbnail-upload`, formData, {
               headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data.success) {
               const thumbnailUrl = response.data.file?.key;
               dishData = { ...data, thumbnail: thumbnailUrl };
               // Update original thumbnail to the uploaded URL
               setOriginalThumbnail(thumbnailUrl);
               setValue("thumbnail", thumbnailUrl);
            } else {
               toast.error("Image upload failed");
               return;
            }
         } catch (error) {
            toast.error("Image upload failed");
            console.log(error);
            return;
         }
      }

      // Only call mutation if image upload was successful or no new image
      if (dishId) {
         updateDishMutation.mutate(dishData);
      } else {
         createDishMutation.mutate(dishData);
      }
   };

   const [categoryQuery, dishDetails] = useQueries({
      queries: [
         {
            queryKey: ["dish-category"],
            queryFn: () =>
               adminInstance.get(`/taxonomy/dishes-category`).then((res) => {
                  const category_list: any = [];
                  res.data.categories?.map(function (item: { [key: string]: string | number }) {
                     category_list.push({ label: item.name, value: item.id });
                  });
                  setCategoryList(category_list);
                  return res.data;
               }),
         },
         {
            queryKey: ["dish-details"],
            queryFn: () =>
               adminInstance.get(`/dish-service/read-dish/${dishId}`).then((res) => {
                  if (res.data.success) {
                     for (const key in defaultValues) {
                        switch (key) {
                           case "category":
                              const taxonomy = res.data?.dish?.categories.map((item: any) => item.taxonomyId);
                              // setOldCategory(taxonomy)
                              setValue("category", taxonomy);
                              break;
                           case "thumbnail":
                              // setThumbnail(res.data.dish['thumbnail'])
                              setValue("thumbnail", res.data.dish["thumbnail"]);
                              setOriginalThumbnail(res.data.dish["thumbnail"]);
                              break;
                           default:
                              setValue(key as keyof DishFormType, res.data.dish[key as keyof DishFormType]);
                              break;
                        }
                     }
                  }
                  return res.data;
               }),
            enabled: !!dishId,
         },
      ],
   });

   return (
      <Card>
         <CardContent>
            <div className="text-lg font-medium mb-4">Add Dish</div>
            <div className="">
               <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="flex flex-wrap -m-4">
                     <div className="w-9/12 space-y-4 p-4">
                        <Field>
                           <Controller
                              name="nonVeg"
                              control={control}
                              render={({ field }) => (
                                 <div className="flex items-center space-x-2">
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} id="nonVeg" className="w-5 h-5" />
                                    <FieldLabel htmlFor="nonVeg">Non-Veg</FieldLabel>
                                 </div>
                              )}
                           />
                        </Field>
                        <Field className="gap-1">
                           <FieldLabel htmlFor="title">Dish Name</FieldLabel>
                           <Controller name="title" control={control} render={({ field }) => <Input {...field} />} />
                           {errors.title && <FieldError>{errors.title.message}</FieldError>}
                        </Field>
                        <Field>
                           <FieldLabel htmlFor="slug">Slug</FieldLabel>
                           <Controller name="slug" control={control} render={({ field }) => <Textarea {...field} rows={1} />} />
                           {errors.slug && <FieldError>{errors.slug.message}</FieldError>}
                        </Field>
                        <Field>
                           <FieldLabel htmlFor="shortDescription">Short Description</FieldLabel>
                           <Controller name="shortDescription" control={control} render={({ field }) => <Textarea {...field} rows={4} />} />
                           {errors.shortDescription && <FieldError>{errors.shortDescription.message}</FieldError>}
                        </Field>
                        <div className="flex flex-wrap -m-2">
                           <div className="w-6/12 space-y-4 p-2">
                              <Field>
                                 <FieldLabel htmlFor="price">Selling Price</FieldLabel>
                                 <Controller
                                    name="price"
                                    control={control}
                                    render={({ field }) => (
                                       <Input
                                          type="number"
                                          min={0}
                                          value={field.value}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                       />
                                    )}
                                 />
                                 {errors.price && <FieldError>{errors.price.message}</FieldError>}
                              </Field>
                              <Field>
                                 <FieldLabel htmlFor="costPrice">Cost Price</FieldLabel>
                                 <Controller
                                    name="costPrice"
                                    control={control}
                                    render={({ field }) => (
                                       <Input
                                          type="number"
                                          min={0}
                                          value={field.value}
                                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                       />
                                    )}
                                 />
                                 {errors.costPrice && <FieldError>{errors.costPrice.message}</FieldError>}
                              </Field>
                           </div>
                           <div className="w-6/12 space-y-4 p-2">
                              <Field>
                                 <FieldLabel htmlFor="category">Category</FieldLabel>
                                 <Controller
                                    name="category"
                                    control={control}
                                    render={({ field: { onChange, value, ...rest } }) => (
                                       <MultiSelect options={categoryList} selected={value} onChange={onChange} placeholder="Select category..." />
                                    )}
                                 />
                              </Field>
                           </div>
                        </div>
                        <Field>
                           <FieldLabel htmlFor="description">Description</FieldLabel>
                           <Controller name="description" control={control} render={({ field }) => <Textarea {...field} rows={10} />} />
                           {errors.description && <FieldError>{errors.description.message}</FieldError>}
                        </Field>
                     </div>
                     <div className="w-3/12 p-4">
                        <Field>
                           <FieldLabel htmlFor="thumbnail">Thumbnail</FieldLabel>
                           <div className="w-full">
                              <Controller
                                 name="thumbnail"
                                 control={control}
                                 render={({ field: { value, onChange, ...rest } }) => (
                                    <ImageUpload
                                       image={value ? process.env.NEXT_PUBLIC_BUCKET_URL + value : ""}
                                       onImage={onChange}
                                       aspect={500 / 600}
                                       className="aspect-[500/600]"
                                    />
                                 )}
                              />
                              {errors.thumbnail && <FieldError>{errors.thumbnail.message}</FieldError>}
                           </div>
                        </Field>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button type="submit" disabled={createDishMutation.isPending || updateDishMutation.isPending}>
                        {(createDishMutation.isPending || updateDishMutation.isPending) && <Loader2 className="animate-spin" />}
                        Save Dish
                     </Button>
                  </div>
               </form>
            </div>
         </CardContent>
      </Card>
   );
};

export default AddCategory;
