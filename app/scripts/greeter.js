// var config = require('../json/config.json');
// module.exports = function(){
// 	var greet = document.createElement('div');
// 	greet.textContent = config.greetText
// 	return greet;
// };
//-------------- es6语法
import config from '../data/config.json';
import greeter from '../styles/greeter.css';//css模块：greeter
export default function(){
	var greet = document.createElement('div');
	greet.textContent = config.greetText;
	// greet.className = greeter.root;//css模块功能
	greet.className = 'root';
	return greet;
};