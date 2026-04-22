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
      <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
         {/* Header */}
         <div className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-semibold tracking-tight">{dishId ? "Edit Dish" : "Add New Dish"}</h1>
               <p className="text-muted-foreground mt-1">{dishId ? "Update dish information and settings" : "Create a new dish for your menu"}</p>
            </div>
            <div className="flex gap-3">
               <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  Cancel
               </Button>
               <Button
                  type="submit"
                  form="dish-form"
                  disabled={createDishMutation.isPending || updateDishMutation.isPending}
                  className="min-w-[120px]">
                  {createDishMutation.isPending || updateDishMutation.isPending ? (
                     <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                     </>
                  ) : dishId ? (
                     "Update Dish"
                  ) : (
                     "Create Dish"
                  )}
               </Button>
            </div>
         </div>

         {/* Form */}
         <form id="dish-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               {/* Left Column - Main Content */}
               <div className="lg:col-span-2 space-y-6">
                  {/* Basic Information Card */}
                  <Card className="border shadow-sm">
                     <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                           <div>
                              <h2 className="text-xl font-semibold">Basic Information</h2>
                              <p className="text-sm text-muted-foreground">Essential details about the dish</p>
                           </div>
                           <Controller
                              name="nonVeg"
                              control={control}
                              render={({ field }) => (
                                 <label
                                    className={`flex items-center gap-3 rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md select-none ${
                                       field.value
                                          ? "border-red-200 bg-red-50 hover:border-red-300 dark:border-red-900 dark:bg-red-950"
                                          : "border-green-200 bg-green-50 hover:border-green-300 dark:border-green-900 dark:bg-green-950"
                                    }`}>
                                    <Checkbox
                                       checked={field.value}
                                       onCheckedChange={field.onChange}
                                       className={`h-5 w-5 rounded border-2 ${
                                          field.value
                                             ? "border-red-500 bg-red-500 data-[state=checked]:bg-red-500 dark:border-red-600"
                                             : "border-green-500 data-[state=checked]:bg-green-500 dark:border-green-600"
                                       }`}
                                    />
                                    <div className="flex flex-col">
                                       <span className="font-semibold text-sm">{field.value ? "🔴 Non-Vegetarian" : "🟢 Vegetarian"}</span>
                                       <span
                                          className={`text-xs font-medium ${field.value ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}`}>
                                          {field.value ? "Contains meat or eggs" : "Plant-based dish"}
                                       </span>
                                    </div>
                                 </label>
                              )}
                           />
                        </div>

                        <div className="space-y-4">
                           <Field className="gap-2">
                              <FieldLabel htmlFor="title" className="text-base">
                                 Dish Name *
                              </FieldLabel>
                              <Controller
                                 name="title"
                                 control={control}
                                 render={({ field }) => (
                                    <Input {...field} placeholder="e.g., Butter Chicken, Margherita Pizza" className="h-11 text-base" />
                                 )}
                              />
                              {errors.title && <FieldError>{errors.title.message}</FieldError>}
                           </Field>

                           <Field className="gap-2">
                              <FieldLabel htmlFor="slug" className="text-base">
                                 Slug *
                              </FieldLabel>
                              <Controller
                                 name="slug"
                                 control={control}
                                 render={({ field }) => (
                                    <div className="relative">
                                       <Input {...field} placeholder="dish-url-slug" className="h-11 text-base font-mono" readOnly />
                                       <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Auto-generated</div>
                                    </div>
                                 )}
                              />
                              {errors.slug && <FieldError>{errors.slug.message}</FieldError>}
                           </Field>

                           <Field className="gap-2">
                              <FieldLabel htmlFor="shortDescription" className="text-base">
                                 Short Description *
                              </FieldLabel>
                              <Controller
                                 name="shortDescription"
                                 control={control}
                                 render={({ field }) => (
                                    <Textarea
                                       {...field}
                                       placeholder="Brief description for menu cards (2-3 lines)"
                                       rows={3}
                                       className="resize-none text-base"
                                    />
                                 )}
                              />
                              {errors.shortDescription && <FieldError>{errors.shortDescription.message}</FieldError>}
                           </Field>
                        </div>
                     </CardContent>
                  </Card>

                  {/* Pricing & Category Card */}
                  <Card className="border shadow-sm">
                     <CardContent className="p-6 space-y-6">
                        <div>
                           <h2 className="text-xl font-semibold">Pricing & Category</h2>
                           <p className="text-sm text-muted-foreground">Set prices and categorization</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                              <Field className="gap-2">
                                 <FieldLabel htmlFor="price" className="text-base">
                                    Selling Price *
                                 </FieldLabel>
                                 <Controller
                                    name="price"
                                    control={control}
                                    render={({ field }) => (
                                       <div className="relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                                          <Input
                                             type="number"
                                             min={0}
                                             step="0.01"
                                             value={field.value}
                                             onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                             placeholder="0.00"
                                             className="h-11 pl-8 text-base"
                                          />
                                       </div>
                                    )}
                                 />
                                 {errors.price && <FieldError>{errors.price.message}</FieldError>}
                              </Field>

                              <Field className="gap-2">
                                 <FieldLabel htmlFor="costPrice" className="text-base">
                                    Cost Price *
                                 </FieldLabel>
                                 <Controller
                                    name="costPrice"
                                    control={control}
                                    render={({ field }) => (
                                       <div className="relative">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                                          <Input
                                             type="number"
                                             min={0}
                                             step="0.01"
                                             value={field.value}
                                             onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                             placeholder="0.00"
                                             className="h-11 pl-8 text-base"
                                          />
                                       </div>
                                    )}
                                 />
                                 {errors.costPrice && <FieldError>{errors.costPrice.message}</FieldError>}
                              </Field>
                           </div>

                           <div className="space-y-4">
                              <Field className="gap-2">
                                 <FieldLabel htmlFor="category" className="text-base">
                                    Category
                                 </FieldLabel>
                                 <Controller
                                    name="category"
                                    control={control}
                                    render={({ field: { onChange, value, ...rest } }) => (
                                       <MultiSelect
                                          options={categoryList}
                                          selected={value}
                                          onChange={onChange}
                                          placeholder="Select categories..."
                                          className="min-h-[44px]"
                                       />
                                    )}
                                 />
                              </Field>

                              {/* Profit Margin Indicator */}
                              {watch("price") > 0 && watch("costPrice") > 0 && (
                                 <div className="rounded-lg border bg-muted/30 p-4">
                                    <div className="text-sm font-medium">Profit Margin</div>
                                    <div className="text-2xl font-bold text-green-600">
                                       {(((watch("price") - watch("costPrice")) / watch("price")) * 100).toFixed(1)}%
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     </CardContent>
                  </Card>

                  {/* Detailed Description Card */}
                  <Card className="border shadow-sm">
                     <CardContent className="p-6 space-y-4">
                        <div>
                           <h2 className="text-xl font-semibold">Detailed Description</h2>
                           <p className="text-sm text-muted-foreground">Full description for website and menu</p>
                        </div>
                        <Field className="gap-2">
                           <Controller
                              name="description"
                              control={control}
                              render={({ field }) => (
                                 <Textarea
                                    {...field}
                                    placeholder="Provide detailed information about ingredients, preparation, taste profile, etc."
                                    rows={8}
                                    className="resize-none text-base"
                                 />
                              )}
                           />
                           {errors.description && <FieldError>{errors.description.message}</FieldError>}
                        </Field>
                     </CardContent>
                  </Card>
               </div>

               {/* Right Column - Thumbnail */}
               <div className="lg:col-span-1">
                  <Card className="border shadow-sm sticky top-6">
                     <CardContent className="p-6 space-y-4">
                        <div>
                           <h2 className="text-xl font-semibold">Thumbnail Image</h2>
                           <p className="text-sm text-muted-foreground">Upload an appetizing photo</p>
                        </div>
                        <Field>
                           <Controller
                              name="thumbnail"
                              control={control}
                              render={({ field: { value, onChange, ...rest } }) => (
                                 <div className="space-y-3">
                                    <ImageUpload
                                       image={value ? process.env.NEXT_PUBLIC_BUCKET_URL + value : ""}
                                       onImage={onChange}
                                       aspect={500 / 600}
                                       className="aspect-[500/600] w-full rounded-lg overflow-hidden border-2 border-dashed"
                                    />
                                    <div className="text-xs text-muted-foreground text-center">Recommended: 500x600px • JPG, PNG</div>
                                 </div>
                              )}
                           />
                           {errors.thumbnail && <FieldError>{errors.thumbnail.message}</FieldError>}
                        </Field>
                     </CardContent>
                  </Card>
               </div>
            </div>
         </form>
      </div>
   );
};

export default AddCategory;
