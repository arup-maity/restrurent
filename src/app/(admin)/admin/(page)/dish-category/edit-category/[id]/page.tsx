"use client";
import React, { useLayoutEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { axiosInstance } from "@/config/axios";
import { handleApiError } from "@/utils";
import { toast } from "sonner";

type CategoryFormType = {
  name: string;
  slug: string;
  description: string;
  thumbnail: string;
};

const EditCategory = ({ params }: { params: { id: string } }) => {
  const id = params.id;
  //
  const defaultValues = { name: "", slug: "", description: "", thumbnail: "" };
  const schema = z.object({
    name: z.string().min(2, "Category name must be at least 2 characters long"),
    slug: z
      .string()
      .min(2, "Category slug must be at least 2 characters long")
      .regex(/^[a-z0-9-]+$/, {
        message:
          "Category slug must contain only lowercase letters and numbers, and must not contain any whitespace or uppercase letters."
      }),
    description: z
      .string()
      .min(10, "Category description must be at least 10 characters long"),
    thumbnail: z.string().url("Please enter a valid URL for the thumbnail")
  });
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<CategoryFormType>({
    defaultValues,
    mode: "onChange",
    resolver: zodResolver(schema)
  });

  useLayoutEffect(() => {
    getCategory();
  }, [id]);

  const onSubmit: SubmitHandler<CategoryFormType> = async (data) => {
    try {
      const res = await axiosInstance.put(
        `/taxonomy/update-taxonomy/${id}`,
        data
      );
      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (error) {
      handleApiError(error);
    }
  };

  async function getCategory() {
    try {
      const res = await axiosInstance.get(`/taxonomy/read-taxonomy/${id}`);
      if (res.data.success) {
        const taxonomyDetails = res.data.taxonomy;
        for (const key in defaultValues) {
          setValue(
            key as keyof CategoryFormType,
            taxonomyDetails[key as keyof CategoryFormType]
          );
        }
      }
    } catch (error) {
      handleApiError(error);
    }
  }

  return (
    <div className="">
      <div className="w-7/12">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <fieldset>
            <label htmlFor="" className="block text-sm text-gray-500 mb-1">
              Category Name
            </label>
            <input
              {...register("name")}
              className="w-full h-9 !bg-transparent text-base border border-slate-400 rounded px-2"
            />
            {errors.name && (
              <div className="text-xs text-red-500">{errors.name.message}</div>
            )}
          </fieldset>
          <fieldset>
            <label htmlFor="" className="block text-sm text-gray-500 mb-1">
              Category Slug
            </label>
            <input
              {...register("slug")}
              className="w-full h-9 !bg-transparent text-base border border-slate-400 rounded px-2"
            />
            {errors.slug && (
              <div className="text-xs text-red-500">{errors.slug.message}</div>
            )}
          </fieldset>
          <fieldset>
            <label htmlFor="" className="block text-sm text-gray-500 mb-1">
              Description
            </label>
            <textarea
              rows={5}
              {...register("description")}
              className="w-full !bg-transparent text-base border border-slate-400 rounded px-2"
            />
            {errors.description && (
              <div className="text-xs text-red-500">
                {errors.description.message}
              </div>
            )}
          </fieldset>
          <fieldset>
            <label htmlFor="" className="block text-sm text-gray-500 mb-1">
              Feature Image
            </label>
            <input
              {...register("thumbnail")}
              className="w-full h-9 !bg-transparent text-base border border-slate-400 rounded px-2"
            />
            {errors.thumbnail && (
              <div className="text-xs text-red-500">
                {errors.thumbnail.message}
              </div>
            )}
          </fieldset>
          <fieldset>
            <button
              type="submit"
              className="border border-slate-400 rounded py-1 px-4"
            >
              Submit
            </button>
          </fieldset>
        </form>
        <p className="opacity-10">
          https://images.pexels.com/photos/27143629/pexels-photo-27143629/free-photo-of-seagull.jpeg
        </p>
      </div>
    </div>
  );
};

export default EditCategory;
