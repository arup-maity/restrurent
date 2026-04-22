import { adminInstance } from "../axios-config";
import { DishResponseType, PaginatedResponse } from "./dish.interface";

class DishService {
   static async getDish(params?: any): Promise<PaginatedResponse<DishResponseType>> {
      return adminInstance.get("/dish-service/all-dishes", { params });
   }
}

export default DishService;
