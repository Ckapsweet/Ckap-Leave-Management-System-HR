// routes/otTypes.js - Mock types for now or can be expanded to a table
import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  // สอดคล้องกับ ot_schema.sql และ frontend
  res.json([
    { id: 1, name: "วันทำงานปกติ", description: "OT วันทำงาน (1.5 เท่า)", multiplier: 1.5 },
    { id: 2, name: "วันหยุดสุดสัปดาห์", description: "OT วันหยุด (1.0 - 3.0 เท่า)", multiplier: 2.0 },
    { id: 3, name: "วันหยุดนักขัตฤกษ์", description: "OT วันหยุดพิเศษ (3.0 เท่า)", multiplier: 3.0 }
  ]);
});

export default router;
