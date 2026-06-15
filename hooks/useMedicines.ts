import { useEffect, useState } from "react";
import { Medicine } from "@/schemas";
import {
  getMedicines,
  addMedicine,
  removeMedicine,
  markAsTaken,
  updateMedicine,
  refillMedicineStock,
  updateMedicineStock,
  snoozeMedicine,
} from "@/storage/medicines";

export function useMedicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMedicines = async () => {
    setIsLoading(true);
    try {
      const data = await getMedicines();
      setMedicines(data);
    } catch (err) {
      console.error("useMedicines fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const addMed = async (newMedicine: Medicine): Promise<boolean> => {
    try {
      const success = await addMedicine(newMedicine);
      if (success) {
        await fetchMedicines();
      }
      return success;
    } catch (err) {
      console.error("useMedicines add error:", err);
      return false;
    }
  };

  const removeMed = async (id: string): Promise<boolean> => {
    try {
      const success = await removeMedicine(id);
      if (success) {
        await fetchMedicines();
      }
      return success;
    } catch (err) {
      console.error("useMedicines remove error:", err);
      return false;
    }
  };

  const takeMed = async (id: string): Promise<boolean> => {
    try {
      const success = await markAsTaken(id);
      if (success) {
        await fetchMedicines();
      }
      return success;
    } catch (err) {
      console.error("useMedicines markAsTaken error:", err);
      return false;
    }
  };

  const updateMed = async (updatedMedicine: Medicine): Promise<boolean> => {
    try {
      const success = await updateMedicine(updatedMedicine);
      if (success) {
        await fetchMedicines();
      }
      return success;
    } catch (err) {
      console.error("useMedicines update error:", err);
      return false;
    }
  };

  const refillMed = async (id: string, refillAmount: number): Promise<boolean> => {
    try {
      const success = await refillMedicineStock(id, refillAmount);
      if (success) {
        await fetchMedicines();
      }
      return success;
    } catch (err) {
      console.error("useMedicines refillMed error:", err);
      return false;
    }
  };

  const updateStock = async (id: string, newStock: number): Promise<boolean> => {
    try {
      const success = await updateMedicineStock(id, newStock);
      if (success) {
        await fetchMedicines();
      }
      return success;
    } catch (err) {
      console.error("useMedicines updateStock error:", err);
      return false;
    }
  };


  const snoozeMed = async (id: string, minutes: number): Promise<boolean> => {
    try {
      const success = await snoozeMedicine(id, minutes);
      if (success) {
        await fetchMedicines();
      }
      return success;
    } catch (err) {
      console.error("useMedicines snoozeMed error:", err);
      return false;
    }
  };

  return {
    medicines,
    isLoading,
    addMed,
    removeMed,
    takeMed,
    updateMed,
    refillMed,
    updateStock,
    snoozeMed,
    refresh: fetchMedicines,
  };
}
