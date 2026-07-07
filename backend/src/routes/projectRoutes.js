const express = require('express');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const projectController = require('../controllers/projectController');
const {
  mongoIdParam,
  createProjectValidation,
  updateProjectValidation,
  autosaveValidation,
  saveHtmlValidation,
} = require('../validators/projectValidation');

const router = express.Router();

router.use(authenticate);

router.get('/', projectController.list);
router.post('/', createProjectValidation, validate, projectController.create);
router.get('/:id', mongoIdParam, validate, projectController.getOne);
router.put('/:id', updateProjectValidation, validate, projectController.update);
router.delete('/:id', mongoIdParam, validate, projectController.remove);
router.put('/:id/autosave', autosaveValidation, validate, projectController.autosave);
router.put('/:id/save-html', saveHtmlValidation, validate, projectController.saveHtml);

module.exports = router;
