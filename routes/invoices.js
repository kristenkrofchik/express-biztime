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
router.put('/:id', async (req, res, next) => {
    try {
      const { id } = req.params;
      const { comp_code, amt, paid, add_date, paid_date } = req.body;
      const results = await db.query('UPDATE invoices SET comp_code=$1, amt=$2, paid=$3, add_date=$4, paid_date=$5 WHERE id=$6 RETURNING id, comp_code, amt, paid, add_date, paid_date', [comp_code, amt, paid, add_date, paid_date])
      if (results.rows.length === 0) {
        throw new ExpressError(`Can't update invoice with id of ${id}`, 404)
      }
      return res.send({ invoice: results.rows[0] })
    } catch (e) {
      return next(e)
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