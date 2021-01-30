import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LookUp } from 'app/core/models/lookUp';
import { AlertifyService } from 'app/core/services/alertify.service';
import { LookUpService } from 'app/core/services/lookUp.service';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { AuthService } from '../login/services/auth.service';
import { Group } from './models/group';
import { GroupService } from './services/group.service';
import { environment } from '../../../../../environments/environment';
import { Subject } from 'rxjs/Rx';
import 'rxjs/add/operator/map';
import { DataTableDirective } from 'angular-datatables';

declare var jQuery: any;

@Component({
  selector: 'app-group',
  templateUrl: './group.component.html',
  styleUrls: ['./group.component.scss']
})
export class GroupComponent implements OnDestroy,AfterViewInit, OnInit {
  
  @ViewChild(DataTableDirective) dtElement: DataTableDirective;
  
  userDropdownList:LookUp[];
  userSelectedItems:LookUp[];

  claimDropdownList:LookUp[];
  claimSelectedItems:LookUp[];

  dropdownSettings: IDropdownSettings;

  groupList:Group[];
  group:Group=new Group();

  groupAddForm: FormGroup;

  isUserChange: boolean = false;
  isClaimChange: boolean = false;

  groupId:number;
  dtTrigger:  Subject<any>=new Subject<any>();

  constructor(private groupService:GroupService, private lookupService:LookUpService,private alertifyService:AlertifyService,private formBuilder: FormBuilder, private authService:AuthService) { }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
  ngAfterViewInit(): void {

    this.getGroupList();

  }
  ngOnInit() {

    this.createGroupAddForm();

    this.dropdownSettings=environment.getDropDownSetting;

      this.lookupService.getOperationClaimLookUp().subscribe(data=>{
        this.claimDropdownList=data;
      });

     this.lookupService.getUserLookUp().subscribe(data=>{
       this.userDropdownList=data;
     });
  }


  getGroupList() {
    this.groupService.getGroupList().subscribe(data => {
      this.groupList = data,
      this.rerender();
    });
  }

  save(){

    if (this.groupAddForm.valid) {
      this.group = Object.assign({}, this.groupAddForm.value)

      if (this.group.id == 0)
        this.addGroup();
      else
        this.updateGroup();

    }

  }

  addGroup(){

    this.groupService.addGroup(this.group).subscribe(data => {
      this.getGroupList();
      this.group = new Group();
      jQuery("#group").modal("hide");
      this.alertifyService.success(data);
      this.clearFormGroup(this.groupAddForm);

    })

  }

  updateGroup(){

    this.groupService.updateGroup(this.group).subscribe(data => {

      var index=this.groupList.findIndex(x=>x.id==this.group.id);
      this.groupList[index]=this.group;
      this.rerender();
      this.group = new Group();
      jQuery("#group").modal("hide");
      this.alertifyService.success(data);
      this.clearFormGroup(this.groupAddForm);

    })

  }

  createGroupAddForm() {
    this.groupAddForm = this.formBuilder.group({
      id: [0],
      groupName: ["", Validators.required],
    })
  }

  deleteGroup(groupId:number){
    this.groupService.deleteGroup(groupId).subscribe(data=>{
      this.alertifyService.success(data.toString());
      this.groupList=this.groupList.filter(x=> x.id!=groupId);
      this.rerender();
    })
  }

  getGroupById(groupId:number){
    this.clearFormGroup(this.groupAddForm);
    this.groupService.getGroupById(groupId).subscribe(data=>{
      this.group=data;
      this.groupAddForm.patchValue(data);
    })
  }

  getGroupClaims(groupId:number){

    this.groupId=groupId;

    this.groupService.getGroupClaims(groupId).subscribe(data => {
      this.claimSelectedItems = data;
    })

  }

  getGroupUsers(groupId:number){

     this.groupId=groupId;

    this.groupService.getGroupUsers(groupId).subscribe(data => {
      this.userSelectedItems = data;
    })
    
  }

  saveGroupClaims(){

    if(this.isClaimChange){

      var ids=this.claimSelectedItems.map(function(x){ return x.id as number});
      this.groupService.saveGroupClaims(this.groupId, ids).subscribe(x=>{
        jQuery("#groupClaims").modal("hide");
        this.isClaimChange=false;
        this.alertifyService.success(x);
      });
      }

  }

  saveGroupUsers(){

    if(this.isUserChange){

      var ids=this.userSelectedItems.map(function(x){ return x.id as number});
      this.groupService.saveGroupUsers(this.groupId, ids).subscribe(x=>{
        jQuery("#groupUsers").modal("hide");
        this.isUserChange=false;
        this.alertifyService.success(x);
      });
      }

  }

  onItemSelect(comboType: string) {
    this.setComboStatus(comboType);
  }

  onSelectAll(comboType: string) {
    this.setComboStatus(comboType);
  }
  onItemDeSelect(comboType: string) {
    this.setComboStatus(comboType);
  }

  setComboStatus(comboType: string) {

    if (comboType == "User")
      this.isUserChange = true;
    else if (comboType == "Claim")
      this.isClaimChange = true;

  }

  clearFormGroup(group: FormGroup) {

    group.markAsUntouched();
    group.reset();

    Object.keys(group.controls).forEach(key => {
      group.get(key).setErrors(null);
      if (key == "id")
        group.get(key).setValue(0);
    });
  }

  checkClaim(claim:string):boolean{
    return this.authService.claimGuard(claim)
  }

  rerender(): void {
    
    if (this.dtElement.dtInstance == undefined) {
      this.dtTrigger.next();
    }
    else {
      this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {

        // Destroy the table first
        dtInstance.destroy();
        // Call the dtTrigger to rerender again
        this.dtTrigger.next();
      });
    }

  }

}
