export default function (req, res, next, id) {
    const UUIDRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
      if(!UUIDRegex.test(id)) {
        return res.status(400).json({ error: `Invalid ID: ${id}`})
      }
    next();
}
