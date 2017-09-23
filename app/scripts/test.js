import '../styles/test.css';

console.log($(document.body));

import jquery from 'jquery';
console.log(jquery(document.body));

var $$ = require('jquery');
console.log($$(document.body));

import moment from 'moment';
console.log(moment);


import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap';

$('#modal-btn').click(function(){
	$('#modal').modal('show');
});
