# 📄 Relational Data Contracts

## API Endpoint: `GET /api/po-overdue/worklist`
* **Returns**: JSON object containing array of exceptions.
* **Fields**:
  * `po_number` (string)
  * `open_quantity` (number)
  * `open_value` (number)
  * `severity` ('CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW')

## API Endpoint: `GET /api/po-overdue/detail`
* **Returns**: Enriched details including supplier metrics and logs.
