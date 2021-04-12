const express = require("express");
const router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");

//returns list of invoices
router.get("/", async function(req, res, next) {
    try {
      const invoicesQuery = await db.query("SELECT * FROM invoices")
      return res.json({ invoices: invoicesQuery.rows});
    } catch(err){
      return next(err)
    }
});

//returns information about a single invoice
router.get("/:id", async function(req, res, next) {
    try {
      const invoiceQuery = await db.query("SELECT * FROM invoices WHERE id = $1", [req.params.id]);
  
      if (invoiceQuery.rows.length === 0) {
        let notFoundError = new ExpressError(`There is no invoice with id '${req.params.id}`);
        notFoundError.status = 404;
        throw notFoundError;
      }
      return res.json({ invoice: invoiceQuery.rows[0] });
    } catch (err) {
      return next(err);
    }
});

//adds an invoice to db
router.post("/", async function(req, res, next) {
    try {
      const result = await db.query(
        `INSERT INTO invoices (comp_code, amt) 
           VALUES ($1, $2) 
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [req.body.comp_code, req.body.amt]);
  
      return res.status(201).json({invoice: result.rows[0]});  
    } catch (err) {
      return next(err);
    }
});

//edits existing invoice
router.put("/:id", async function (req, res, next) {
    try {
      let {amt, paid} = req.body;
      let id = req.params.id;
      let paidDate = null;
  
      const currResult = await db.query(
            `SELECT paid
             FROM invoices
             WHERE id = $1`,
          [id]);
  
      if (currResult.rows.length === 0) {
        throw new ExpressError(`No such invoice: ${id}`, 404);
      }
  
      const currPaidDate = currResult.rows[0].paid_date;
  
      if (!currPaidDate && paid) {
        paidDate = new Date();
      } else if (!paid) {
        paidDate = null
      } else {
        paidDate = currPaidDate;
      }
  
      const result = await db.query(
            `UPDATE invoices
             SET amt=$1, paid=$2, paid_date=$3
             WHERE id=$4
             RETURNING id, comp_code, amt, paid, add_date, paid_date`,
          [amt, paid, paidDate, id]);
  
      return res.json({"invoice": result.rows[0]});
    }
  
    catch (err) {
      return next(err);
    }
  
  });

//deletes a company
router.delete("/:id", async function(req, res, next) {
    try {
      const result = await db.query(
        "DELETE FROM invoices WHERE id = $1 RETURNING id", [req.params.id]);
  
        if (result.rows.length === 0) {
            throw new ExpressError(`There is no invoice with an id of '${req.params.id}`, 404);
        }
        return res.json({ status: "Invoice deleted" });
    } catch (err) {
      return next(err);
    }
});
  
module.exports = router;