// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package v1

import (
	"bytes"
	"encoding/json"
	"fmt"

	modelAPI "github.com/perses/perses/pkg/model/api"
)

type FolderDisplay struct {
	Name string `json:"name,omitempty" yaml:"name,omitempty"`
}

// FolderItem is a single node in the folder tree. Kind is either "Dashboard" or "Folder".
// When Kind is "Folder", Items holds the nested children.
type FolderItem struct {
	// Kind can only have two values: `Dashboard` or `Folder`
	Kind Kind `json:"kind" yaml:"kind"`
	// Name is the reference to the dashboard when `Kind` is equal to `Dashboard`.
	// When `Kind` is equal to `Folder`, then it's just the name of the folder.
	Name  string       `json:"name" yaml:"name"`
	Items []FolderItem `json:"items,omitempty" yaml:"items,omitempty"`
}

// legacyFolderItem decodes a FolderItem in both formats. Before the folder format changed,
// the children of a sub-folder were stored under `spec` instead of `items`, so both keys are read.
type legacyFolderItem struct {
	Kind       Kind         `json:"kind" yaml:"kind"`
	Name       string       `json:"name" yaml:"name"`
	Items      []FolderItem `json:"items,omitempty" yaml:"items,omitempty"`
	LegacySpec []FolderItem `json:"spec,omitempty" yaml:"spec,omitempty"`
}

func (l legacyFolderItem) toFolderItem() FolderItem {
	items := l.Items
	if len(items) == 0 {
		items = l.LegacySpec
	}
	return FolderItem{Kind: l.Kind, Name: l.Name, Items: items}
}

func (f *FolderItem) UnmarshalJSON(data []byte) error {
	var raw legacyFolderItem
	if err := json.Unmarshal(data, &raw); err != nil {
		return err
	}
	tmp := raw.toFolderItem()
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*f = tmp
	return nil
}

func (f *FolderItem) UnmarshalYAML(unmarshal func(any) error) error {
	var raw legacyFolderItem
	if err := unmarshal(&raw); err != nil {
		return err
	}
	tmp := raw.toFolderItem()
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*f = tmp
	return nil
}

func (f *FolderItem) validate() error {
	if f.Kind != KindDashboard && f.Kind != KindFolder {
		return fmt.Errorf("kind can only be %q or %q but not %q", KindDashboard, KindFolder, f.Kind)
	}
	if len(f.Name) == 0 {
		return fmt.Errorf("name is required")
	}
	if f.Kind == KindDashboard && len(f.Items) > 0 {
		return fmt.Errorf("when kind is equal to %q, then items must be empty", KindDashboard)
	}
	return nil
}

type FolderSpec struct {
	Display *FolderDisplay `json:"display,omitempty" yaml:"display,omitempty"`
	Items   []FolderItem   `json:"items,omitempty" yaml:"items,omitempty"`
}

// UnmarshalJSON also accepts the previous folder format, where `spec` was the list of items
// itself rather than an object. Folders stored in that format are still in some databases,
// and they are written back in the current format the next time they are saved.
func (s *FolderSpec) UnmarshalJSON(data []byte) error {
	if trimmed := bytes.TrimSpace(data); len(trimmed) > 0 && trimmed[0] == '[' {
		var items []FolderItem
		if err := json.Unmarshal(trimmed, &items); err != nil {
			return err
		}
		*s = FolderSpec{Items: items}
		return nil
	}
	var tmp FolderSpec
	type plain FolderSpec
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	*s = tmp
	return nil
}

// UnmarshalYAML accepts both folder formats, see UnmarshalJSON.
func (s *FolderSpec) UnmarshalYAML(unmarshal func(any) error) error {
	var items []FolderItem
	if err := unmarshal(&items); err == nil {
		*s = FolderSpec{Items: items}
		return nil
	}
	var tmp FolderSpec
	type plain FolderSpec
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	*s = tmp
	return nil
}

type Folder struct {
	Kind     Kind            `json:"kind" yaml:"kind"`
	Metadata ProjectMetadata `json:"metadata" yaml:"metadata"`
	Spec     FolderSpec      `json:"spec" yaml:"spec"`
}

func (f *Folder) SetFolderID(id int64) {
	//TODO implement me
	panic("implement me")
}

func (f *Folder) SetUserType(userType string) {
	//TODO implement me
	panic("implement me")
}

func (f *Folder) GetMetadata() modelAPI.Metadata {
	return &f.Metadata
}

func (f *Folder) SetUserID(id int64) {
	f.Metadata.UserID = id
}

func (f *Folder) SetProjectID(id int64) {
	f.Metadata.ProjectID = id
}

func (f *Folder) GetKind() string {
	return string(f.Kind)
}

func (f *Folder) GetSpec() any {
	return f.Spec
}

func (f *Folder) UnmarshalJSON(data []byte) error {
	var tmp Folder
	type plain Folder
	if err := json.Unmarshal(data, (*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*f = tmp
	return nil
}

func (f *Folder) UnmarshalYAML(unmarshal func(any) error) error {
	var tmp Folder
	type plain Folder
	if err := unmarshal((*plain)(&tmp)); err != nil {
		return err
	}
	if err := (&tmp).validate(); err != nil {
		return err
	}
	*f = tmp
	return nil
}

func (f *Folder) validate() error {
	if f.Kind != KindFolder {
		return fmt.Errorf("invalid kind: %q for a Folder type", f.Kind)
	}

	// we should not validate the spec here because it can be empty. user can create a folder without any dashboard.
	//if len(f.Spec) == 0 {
	//	return fmt.Errorf("spec cannot be empty")
	//}

	// Verify there is only one reference to a dashboard.
	// We have to limit it because otherwise in the UI we won't be able to determinate from which folder the dashboard is coming from.
	// You will likely have this link https://perses-dev/project/<your_project>/folders/<folder_name>/<dashboard_name>.
	// Because the number of folders you can describe in this document is not limited but the URL is limited, you won't be able to put the folder tree in the URL.
	//
	// So if the dashboard is referenced in multiple sub-folder, the UI won't be able to know from which folder the dashboard is coming from.
	itemList := make([]FolderItem, len(f.Spec.Items))
	copy(itemList, f.Spec.Items)
	dashboardSet := make(map[string]bool)
	for len(itemList) > 0 {
		var current FolderItem
		current, itemList = itemList[0], itemList[1:]
		if current.Kind == KindDashboard {
			if !dashboardSet[current.Name] {
				dashboardSet[current.Name] = true
			} else {
				return fmt.Errorf("dashboard %q is referenced multiple times in the folder %q", current.Name, f.Metadata.Name)
			}
		} else {
			itemList = append(itemList, current.Items...)
		}
	}
	return nil
}
