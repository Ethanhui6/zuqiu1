import {el} from '../utils/dom.js';

function helpNode(help){return help?el('small',{className:'field-help',text:help}):null}
function errorNode(){return el('small',{className:'field-error',attrs:{role:'alert','aria-live':'polite'}})}

export function createField({label,name,type='text',value='',min,max,step,inputMode,placeholder='',help='',required=false,onInput,onChange,options,ariaLabel}){
  const id=`field-${name}`;
  let control;
  if(options){
    control=el('select',{className:'field-control',attrs:{id,name,'aria-label':ariaLabel||label}});
    options.forEach(option=>{
      const [optionValue,optionLabel]=Array.isArray(option)?option:[option,option];
      control.append(el('option',{text:optionLabel,attrs:{value:optionValue,selected:String(optionValue)===String(value)}}));
    });
  }else{
    control=el('input',{className:'field-control',attrs:{id,name,type,value,min,max,step,inputmode:inputMode,placeholder,required,'aria-label':ariaLabel||label,autocomplete:'off'}});
  }
  const error=errorNode();
  const wrapper=el('label',{className:'field',attrs:{for:id}},[
    el('span',{className:'field-label',text:label}),control,helpNode(help),error
  ]);
  const setError=message=>{error.textContent=message||'';wrapper.classList.toggle('has-error',Boolean(message));control.setAttribute('aria-invalid',String(Boolean(message)))};
  control.addEventListener('input',event=>onInput?.(event.target.value,{control,setError}));
  control.addEventListener('change',event=>onChange?.(event.target.value,{control,setError}));
  return{wrapper,control,setError};
}

export function createDateField({label,name,value,min,max,help,onChange}){
  return createField({label,name,type:'date',value,min,max,help,ariaLabel:label,onInput:value=>onChange?.(value),onChange:value=>onChange?.(value)});
}
