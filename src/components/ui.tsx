import type { ButtonHTMLAttributes, HTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
export function Button({variant='primary',className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{variant?:'primary'|'secondary'|'ghost'|'coral'}){return <button className={`btn btn-${variant} ${className}`} {...props}/>} 
export function Card({children,className='',...props}:HTMLAttributes<HTMLDivElement>&{children:ReactNode}){return <div className={`card ${className}`} {...props}>{children}</div>}
export function Input({label,...props}:InputHTMLAttributes<HTMLInputElement>&{label:string}){return <label className="field"><span>{label}</span><input {...props}/></label>}
export function ProgressBar({value,max=100}:{value:number;max?:number}){return <div className="progress" role="progressbar" aria-valuenow={value} aria-valuemax={max}><span style={{width:`${Math.min(100,value/max*100)}%`}}/></div>}
export function EmptyState({icon,heading,body,action}:{icon:ReactNode;heading:string;body:string;action?:ReactNode}){return <Card className="empty"><div className="empty-icon">{icon}</div><h3>{heading}</h3><p>{body}</p>{action}</Card>}
