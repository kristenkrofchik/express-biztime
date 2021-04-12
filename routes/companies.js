const express = require("express");
let router = new express.Router();
const db = require("../db");
const ExpressError = require("../expressError");
let slugify = require('slugify');

//returns list of companies
router.get("/", async function(req, res, next) {
    try {
      const companiesQuery = await db.query("SELECT code, name, description FROM companies");
      return res.json({ "companies": companiesQuery.rows});
    } catch(err) {
      return next(err)
    }
});

//returns information about a single company
router.get("/:code", async function(req, res, next) {
    try {
      const companyQuery = await db.query("SELECT code, name, description FROM companies WHERE code = $1", [req.params.code]);

      const invoiceQuery = await db.query(`SELECT id FROM invoices WHERE comp_code = $1`, [req.params.code]
    );

    if (companyQuery.rows.length === 0) {
        let notFoundError = new ExpressError(`There is no company with code ${req.params.code}`);
        notFoundError.status = 404;
        throw notFoundError;
    }
        const invoices = invoiceQuery.rows;

        company.invoices = invoices.rows.map(inv => inv.id);

        return res.json({ 'company': companyQuery.rows[0] });
    } catch (err) {
      return next(err);
    }
});

//adds a company to db
router.post("/", async function(req, res, next) {
    try {
      let code = slugify(req.body.name, {lower: true});

      const result = await db.query(
        `INSERT INTO companies (code, name, description) 
           VALUES ($1, $2, $3) 
           RETURNING code, name, description`,
        [code, req.body.name, req.body.description]);
  
      return res.status(201).json({"company": result.rows[0]});  
    } catch (err) {
      return next(err);
    }
});

//edits existing company
router.put('/:code', async (req, res, next) => {
    try {
      let code = req.params.code;
      const { name, description } = req.body;
      const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, code])
      if (results.rows.length === 0) {
        throw new ExpressError(`Can't update company with code of ${code}`, 404)
      }
      return res.send({ "company": results.rows[0] })
    } catch (e) {
      return next(e)
    }
});

//deletes a company
router.delete("/:code", async function(req, res, next) {
    try {
      const result = await db.query(
        "DELETE FROM companies WHERE code = $1 RETURNING code", [req.params.code]);
  
        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with a code of '${req.params.id}`, 404);
        }
        return res.json({ status: "Company deleted" });
    } catch (err) {
      return next(err);
    }
});
  
module.exports = router;